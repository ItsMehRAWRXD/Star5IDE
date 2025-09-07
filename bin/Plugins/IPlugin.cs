using System;

namespace PolymorphicRig.Plugins
{
    public interface IPlugin
    {
        string Name { get; }
        string Description { get; }
        void Execute();
        void Configure(string[] args);
    }
}