## Build Type: trujs.file

The `trujs.file` build type is a simple file collector. It uses values in the `files` property to determine the list of file paths, and then loads them.

This build type can be used to collect files in one workflow and then share them with the other workflows, using includes, or the `file.collect` factory can be used as the base for other build types.

| Property Name | Type | Description |
| - | - | - |
|files | string array | An array of strings, each of which <br>represents a file path or path fragment
|repos | object array | An array of objects, instances of `{iRepoMeta}`,<br> which will be used to prep the reposositories<br>for the file collection process.

###### FILES PROPERTY

The collector uses the `files` property to determine which files to load. The property is an array of 1..n string. Each string is either a file path or a path fragment.

Example:
```json
{
    "files": [
        "[r]./*.doc.*"
        , "[r,-]./*.json"
        , "-{project}/project.namespace/*"
        , "{source}/TruJS/build/runner/*.js"
        , "./[views|components]/*.[html|css|scss]"
    ]
}
```

| Name | Definition |
|--|--|
|files | := 1*`path-fragment`
|path-fragment | := [`modifier`] `root` [`path`] [sep `file-name`]
|sep | := "/" / "\\"
|modifier | := ("[" `mod` 0*("," `mod`) "]") / `mod`
|mod | := "r" / "-"
|root | := `cwd` / `source-tag` / `project-tag`
|cwd | := "."
|source-tag | := "{source}"
|project-tag | := "{project}"
|path | := 1*(sep path-seg)
|path-seg | :=
|file-name | := name ext
|name | :=
|ext | :=

###### REPOS PROPERTY

The trujs.file collector includes a means to ensure the required files are available and at the correct version. It does this by using external source control mechanisms to clone and checkout exactly what the project requires.



Example:

```json
{
    "type": "git"
    , "url": "https://github.com/trujs/TruJS.core.git"
    , "branch": "development"
    , "local": "TruJS/core"
}
```