using System;
using System.Collections.Generic;

namespace PluginSystem
{
    public interface IPlugin
    {
        string Name { get; }
        string Version { get; }
        string Description { get; }
        Dictionary<string, object> Configuration { get; set; }
        
        void Initialize();
        void Execute();
        void Cleanup();
    }

    public interface IEncryptionPlugin : IPlugin
    {
        byte[] Encrypt(byte[] data, string algorithm, Dictionary<string, object> parameters);
        byte[] Decrypt(byte[] data, string algorithm, Dictionary<string, object> parameters);
        string[] GetSupportedAlgorithms();
    }

    public interface ILoaderPlugin : IPlugin
    {
        void LoadPayload(byte[] payload);
        void ExecutePayload();
        void SetEnvironment(Dictionary<string, object> environment);
    }

    public interface IPatcherPlugin : IPlugin
    {
        void RegisterMarker(string name, IntPtr address);
        bool ApplyPatch(string patchName, string markerName);
        byte[] GenerateTemplate(string templateType, int size);
    }
}