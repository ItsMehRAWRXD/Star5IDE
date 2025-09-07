using System;
using System.Reflection;

namespace HotPatcher
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("=== Hot Patcher v1.0 ===");
            Console.WriteLine("Dynamic code patching with car() markers");
            Console.WriteLine("Type 'help' for available commands\n");

            var patcher = new HotPatcher();

            // Register car() markers from the polymorphic loader
            RegisterCarMarkers(patcher);

            // Process command line arguments
            if (args.Length > 0)
            {
                var command = string.Join(" ", args);
                patcher.ProcessCommand(command);
                return;
            }

            // Interactive mode
            while (true)
            {
                Console.Write("HotPatcher> ");
                var command = Console.ReadLine();
                
                if (string.IsNullOrEmpty(command))
                    continue;

                if (command.ToLower() == "exit")
                    break;

                patcher.ProcessCommand(command);
                Console.WriteLine();
            }

            Console.WriteLine("Goodbye!");
        }

        private static void RegisterCarMarkers(HotPatcher patcher)
        {
            try
            {
                // Try to find the polymorphic loader assembly
                var loaderAssembly = Assembly.LoadFrom("PolymorphicLoader.dll");
                var loaderType = loaderAssembly.GetType("PolymorphicLoader.PolymorphicLoader");

                if (loaderType != null)
                {
                    // Register car markers using reflection
                    for (int i = 1; i <= 5; i++)
                    {
                        var markerMethod = loaderType.GetMethod($"car_marker_{i}");
                        if (markerMethod != null)
                        {
                            var methodHandle = markerMethod.MethodHandle;
                            var methodPtr = methodHandle.GetFunctionPointer();
                            patcher.RegisterMarker($"car_marker_{i}", methodPtr);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Warning: Could not register car markers: {ex.Message}");
                Console.WriteLine("You can still use the patcher with manual marker registration.");
            }
        }
    }
}