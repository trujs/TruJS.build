## Interface: iRepoMeta

The `{iRepoMeta}` interface provides an abstraction for identifying code repositories, where to find them (url), which branch (commit, tag) is required and the local file system path where the repo will be cloned to.

During a file collection process, the required `{iRepoMeta}` instances are used to clone and checkout the files required for that collection process.

Example:

```json
{
    "type": "git"
    , "url": "https://github.com/trujs/TruJS.core.git"
    , "branch": "development"
    , "local": "TruJS/core"
}
```