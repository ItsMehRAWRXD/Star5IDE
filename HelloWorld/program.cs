using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Diagnostics;

class Program {
    static int Main(string[] args) {
        try {
            if (args.Length == 0 || args[0] == "--help" || args[0] == "-h") {
                PrintHelp();
                return 0;
            }

            var cmd = args[0].ToLowerInvariant();
            switch (cmd) {
                case "encrypt":
                    // encrypt <inputText> <passphrase> [--engine native|openssl]
                    RequireArgs(args, 3);
                    Console.Write(EncryptBase64(args[1], args[2], ParseEngine(args)));
                    return 0;
                case "decrypt":
                    // decrypt <encryptedBase64> <passphrase> [--engine native|openssl]
                    RequireArgs(args, 3);
                    Console.Write(DecryptBase64(args[1], args[2], ParseEngine(args)));
                    return 0;
                case "repack":
                    // repack <encryptedBase64> [metaJson]
                    RequireArgs(args, 2);
                    var meta = args.Length >= 3 ? args[2] : "{}";
                    var pkg = Repack(args[1], meta);
                    Console.Write(pkg);
                    return 0;
                case "unpack":
                    // unpack <packageBase64>
                    RequireArgs(args, 2);
                    Console.Write(Unpack(args[1]));
                    return 0;
                case "stub-to":
                    // stub-to <language> <targetFilePath> <passphrase> [--engine native|openssl]
                    RequireArgs(args, 4);
                    var stub = GenerateStub(args[1]);
                    var enc = EncryptBase64(stub, args[3], ParseEngine(args));
                    var pkgJson = Repack(enc, JsonSerializer.Serialize(new { language = args[1], target = args[2] }));
                    File.WriteAllText(args[2], pkgJson, new UTF8Encoding(false));
                    Console.WriteLine("OK");
                    return 0;
                case "package":
                    // package <targetFilePath> <passphrase> [--text <text>] [--exts <.txt,.md>] [--root <dir>] [--engine native|openssl]
                    return PackageCommand(args.Skip(1).ToArray());
                default:
                    Console.Error.WriteLine($"Unknown command: {cmd}");
                    PrintHelp();
                    return 2;
            }
        } catch (Exception ex) {
            Console.Error.WriteLine(ex.Message);
            return 1;
        }
    }

    static void PrintHelp() {
        Console.WriteLine("Usage:");
        Console.WriteLine("  encrypt <inputText> <passphrase>");
        Console.WriteLine("  decrypt <encryptedBase64> <passphrase>");
        Console.WriteLine("  repack <encryptedBase64> [metaJson]");
        Console.WriteLine("  unpack <packageBase64>");
        Console.WriteLine("  stub-to <language> <targetFilePath> <passphrase>");
        Console.WriteLine("  package <targetFilePath> <passphrase> [--text <text>] [--exts <.txt,.md>] [--root <dir>]");
    }

    static void RequireArgs(string[] a, int n) {
        if (a.Length < n) throw new ArgumentException("Not enough arguments.");
    }

    static string EncryptBase64(string plain, string passphrase) {
        // openssl enc -aes-256-cbc -pbkdf2 -salt -base64 -pass pass:...
        var psi = new ProcessStartInfo("openssl", $"enc -aes-256-cbc -pbkdf2 -salt -base64 -pass pass:\"{passphrase.Replace("\"", "\\\"")}\"") {
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false
        };
        using var p = Process.Start(psi) ?? throw new Exception("Failed to start openssl");
        using (var sw = new StreamWriter(p.StandardInput.BaseStream, new UTF8Encoding(false))) {
            sw.Write(plain);
        }
        var output = p.StandardOutput.ReadToEnd();
        var err = p.StandardError.ReadToEnd();
        p.WaitForExit();
        if (p.ExitCode != 0) throw new Exception($"OpenSSL error: {err}");
        return output.Trim();
    }

    static string DecryptBase64(string encryptedBase64, string passphrase) {
        var psi = new ProcessStartInfo("openssl", $"enc -aes-256-cbc -pbkdf2 -d -base64 -pass pass:\"{passphrase.Replace("\"", "\\\"")}\"") {
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false
        };
        using var p = Process.Start(psi) ?? throw new Exception("Failed to start openssl");
        using (var sw = new StreamWriter(p.StandardInput.BaseStream, new UTF8Encoding(false))) {
            sw.Write(encryptedBase64);
        }
        var output = p.StandardOutput.ReadToEnd();
        var err = p.StandardError.ReadToEnd();
        p.WaitForExit();
        if (p.ExitCode != 0) throw new Exception($"OpenSSL error: {err}");
        return output;
    }

    static string Repack(string encryptedBase64, string metaJson) {
        using var doc = JsonDocument.Parse(metaJson);
        var metaEl = doc.RootElement.Clone();
        var package = new Dictionary<string, object?> {
            ["meta"] = MergeMeta(metaEl),
            ["data"] = encryptedBase64
        };
        var json = JsonSerializer.Serialize(package);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    static string Unpack(string packageBase64) {
        var json = Encoding.UTF8.GetString(Convert.FromBase64String(packageBase64));
        using var doc = JsonDocument.Parse(json);
        var meta = doc.RootElement.GetProperty("meta");
        var data = doc.RootElement.GetProperty("data").GetString() ?? "";
        var pretty = JsonSerializer.Serialize(new { meta, data }, new JsonSerializerOptions { WriteIndented = true });
        return pretty;
    }

    static Dictionary<string, object?> MergeMeta(JsonElement input) {
        var meta = new Dictionary<string, object?>();
        // baseline
        meta["method"] = "Camilla-256-CBC";
        meta["chain"] = new [] { "Camilla-256-CBC" };
        meta["timestamp"] = DateTime.UtcNow.ToString("o");
        // merge provided
        if (input.ValueKind == JsonValueKind.Object) {
            foreach (var prop in input.EnumerateObject()) {
                meta[prop.Name] = prop.Value.ValueKind == JsonValueKind.String
                    ? prop.Value.GetString()
                    : JsonSerializer.Deserialize<object>(prop.Value.GetRawText());
            }
        }
        return meta;
    }

    static string GenerateStub(string language) {
        switch ((language ?? "node").ToLowerInvariant()) {
            case "node":
                return "function run() {\n  console.log(\"Star5IDE Node stub running!\");\n}\nrun();\n";
            case "python":
                return "def run():\n    print(\"Star5IDE Python stub running!\")\n\nif __name__ == \"__main__\":\n    run()\n";
            case "ruby":
                return "def run\n  puts \"Star5IDE Ruby stub running!\"\nend\nrun\n";
            case "text":
                return "42\n";
            default:
                return "42\n";
        }
    }

    static int PackageCommand(string[] args) {
        if (args.Length < 2) throw new ArgumentException("package requires <targetFilePath> <passphrase>");
        var target = args[0];
        var pass = args[1];
        string? text = null;
        string root = Directory.GetCurrentDirectory();
        var exts = new List<string>();
        for (int i = 2; i < args.Length; i++) {
            if (args[i] == "--text" && i + 1 < args.Length) { text = args[++i]; continue; }
            if (args[i] == "--exts" && i + 1 < args.Length) { exts = NormalizeExts(args[++i]); continue; }
            if (args[i] == "--root" && i + 1 < args.Length) { root = args[++i]; continue; }
        }
        var files = exts.Count > 0 ? CollectByExtensions(root, exts) : new List<string>();
        var payload = new {
            version = 1,
            createdAt = DateTime.UtcNow.ToString("o"),
            text = text ?? "",
            files = files.Select(p => ReadFileEntry(p)).ToList()
        };
        var plain = JsonSerializer.Serialize(payload);
        var enc = EncryptBase64(plain, pass);
        var pkg = Repack(enc, JsonSerializer.Serialize(new { filter = exts, target }));
        File.WriteAllText(target, pkg, new UTF8Encoding(false));
        Console.WriteLine($"OK ({files.Count} files, text={(text != null)})");
        return 0;
    }

    static List<string> NormalizeExts(string input) {
        return input.Split(',')
            .Select(s => s.Trim())
            .Where(s => s.Length > 0)
            .Select(s => s.Replace("*", ""))
            .Select(s => s.StartsWith('.') ? s.ToLowerInvariant() : ("." + s.ToLowerInvariant()))
            .Distinct()
            .ToList();
    }

    static List<string> CollectByExtensions(string root, List<string> exts) {
        var list = new List<string>();
        foreach (var f in Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories)) {
            try {
                if (exts.Contains(Path.GetExtension(f).ToLowerInvariant())) list.Add(f);
            } catch { }
        }
        return list;
    }

    static object ReadFileEntry(string path) {
        try {
            var data = File.ReadAllBytes(path);
            var info = new FileInfo(path);
            return new {
                path = path,
                name = info.Name,
                size = info.Length,
                mtimeMs = info.LastWriteTimeUtc.Subtract(new DateTime(1970,1,1)).TotalMilliseconds,
                encoding = "base64",
                data = Convert.ToBase64String(data)
            };
        } catch (Exception ex) {
            return new { path = path, error = ex.Message };
        }
    }
}
