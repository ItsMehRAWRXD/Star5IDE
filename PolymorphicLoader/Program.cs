using System;

namespace PolymorphicLoader
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                PolymorphicLoader.Execute();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}");
            }
            
            Console.WriteLine("\nPress any key to exit...");
            Console.ReadKey();
        }
    }
}