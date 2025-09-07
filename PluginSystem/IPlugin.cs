using System;
using System.Collections.Generic;

namespace PolymorphicPluginSystem
{
    /// <summary>
    /// Base interface for all plugins
    /// </summary>
    public interface IPlugin
    {
        string Name { get; }
        string Version { get; }
        string Description { get; }
        void Initialize(Dictionary<string, object> config);
        void Execute(string[] args);
        void Shutdown();
    }

    /// <summary>
    /// Interface for encryption plugins
    /// </summary>
    public interface IEncryptionPlugin : IPlugin
    {
        byte[] Encrypt(byte[] data, string algorithm, Dictionary<string, object> parameters);
        byte[] Decrypt(byte[] data, string algorithm, Dictionary<string, object> parameters);
        string[] SupportedAlgorithms { get; }
    }

    /// <summary>
    /// Interface for loader plugins
    /// </summary>
    public interface ILoaderPlugin : IPlugin
    {
        void LoadAndExecute(byte[] payload, Dictionary<string, object> options);
        bool SupportsHotPatching { get; }
        void ApplyPatch(byte[] patch, int offset);
    }

    /// <summary>
    /// Interface for patcher plugins
    /// </summary>
    public interface IPatcherPlugin : IPlugin
    {
        byte[] GeneratePatch(string targetFile, Dictionary<string, object> patchConfig);
        bool ApplyPatchToProcess(int processId, byte[] patch, IntPtr address);
        IntPtr[] FindPatchPoints(int processId);
    }
}