// This file serves as a hacky workaround for the lack of "resolveSync" support in webpack.
// We make our own resolver using a sync file system but using the same plugins & options
// that webpack does.
import interfaces = require('./interfaces');

const Resolver = require("enhanced-resolve/lib/Resolver");
const SyncNodeJsInputFileSystem = require("enhanced-resolve/lib/SyncNodeJsInputFileSystem");
const CachedInputFileSystem = require("enhanced-resolve/lib/CachedInputFileSystem");
const UnsafeCachePlugin = require("enhanced-resolve/lib/UnsafeCachePlugin");
const ModulesInDirectoriesPlugin = require("enhanced-resolve/lib/ModulesInDirectoriesPlugin");
const ModulesInRootPlugin = require("enhanced-resolve/lib/ModulesInRootPlugin");
const ModuleAsFilePlugin = require("enhanced-resolve/lib/ModuleAsFilePlugin");
const ModuleAsDirectoryPlugin = require("enhanced-resolve/lib/ModuleAsDirectoryPlugin");
const ModuleAliasPlugin = require("enhanced-resolve/lib/ModuleAliasPlugin");
const DirectoryDefaultFilePlugin = require("enhanced-resolve/lib/DirectoryDefaultFilePlugin");
const DirectoryDescriptionFilePlugin = require("enhanced-resolve/lib/DirectoryDescriptionFilePlugin");
const DirectoryDescriptionFileFieldAliasPlugin = require("enhanced-resolve/lib/DirectoryDescriptionFileFieldAliasPlugin");
const FileAppendPlugin = require("enhanced-resolve/lib/FileAppendPlugin");
const ResultSymlinkPlugin = require("enhanced-resolve/lib/ResultSymlinkPlugin");

function makeRootPlugin(name: string, root: string | string[]) {
    if (typeof root === "string") {
        return new ModulesInRootPlugin(name, root);
    } else if (Array.isArray(root)) {
        return function() {
            root.forEach(function(root) {
                this.apply(new ModulesInRootPlugin(name, root));
            }, this);
        };
    }
    return function() {};
}

function makeResolver(options: { resolve: interfaces.Resolve }) {
    let fileSystem = new CachedInputFileSystem(new SyncNodeJsInputFileSystem(), 60000);

    let resolver = new Resolver(fileSystem);

    // apply the same plugins that webpack does, see webpack/lib/WebpackOptionsApply.js
    resolver.apply(
        new UnsafeCachePlugin(options.resolve.unsafeCache),
        options.resolve.packageAlias ? new DirectoryDescriptionFileFieldAliasPlugin("package.json", options.resolve.packageAlias) : function() {},
        new ModuleAliasPlugin(options.resolve.alias),
        makeRootPlugin("module", options.resolve.root),
        new ModulesInDirectoriesPlugin("module", options.resolve.modulesDirectories),
        makeRootPlugin("module", options.resolve.fallback),
        new ModuleAsFilePlugin("module"),
        new ModuleAsDirectoryPlugin("module"),
        new DirectoryDescriptionFilePlugin("package.json", options.resolve.packageMains),
        new DirectoryDefaultFilePlugin(["index"]),
        new FileAppendPlugin(options.resolve.extensions),
        new ResultSymlinkPlugin()
    );

    return resolver;
}

export = makeResolver;
