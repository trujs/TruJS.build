/**
* The git repo takes an instance of `{iRepoMeta}` and ensures the Git repository has been cloned at the local file path and the head is at a commit #, a branch, or a tag.
* @factory
*/
function _GitRepo(
    promise
    , workspacePath
    , gitDriver
    , node_path
    , node_fs
    , defaults
    , errors
) {

    /**
    * @worker
    */
    return function GitRepo(repoMeta) {
        var localPath;
        //start the repo process by doing some input validation and generate a fully qualified path
        return startRepoProcess(
            repoMeta
        )
        //then check to see if the directory exists
        .then(function thenCheckForDir(lp) {
            localPath = lp;
            return checkForDirectory(
                localPath
            );
        })
        //then clone repo if no directory
        .then(function thenCloneRepo(dirExists) {
            if (dirExists) {
                return promise.resolve();
            }
            return cloneRepo(
                repoMeta.url
                , localPath
            );
        })
        //then do a fetch if we didn't clone
        .then(function thenDoFetch(wasCloned) {
            if (wasCloned) {
                return promise.resolve();
            }
            return fetchUpdates(
                localPath
            );
        })
        //then checkout the commit, branch or tag
        .then(function thenCheckout() {
            return checkout(
                repoMeta
                , localPath
            );
        });
    };

    /**
    * Validates the `repoMeta` object has the nessesary properties and returns the local path for processing
    * @function
    */
    function startRepoProcess(repoMeta) {
        return new promise(function promiseStartProcess(resolve, reject) {
            try {
                ///INPUT VALIDATION
                if (
                    !repoMeta.hasOwnProperty("url")
                    || !repoMeta.hasOwnProperty("branch")
                    || !repoMeta.hasOwnProperty("local")
                ) {
                    reject(
                        new Error(`${errors.invalid_repo_meta} (${repoMeta.type})`)
                    );
                }
                ///END INPUT VALIDATION

                resolve(
                    node_path.join(
                        workspacePath
                        , defaults.sourceDirectory
                        , repoMeta.local
                    )
                );
            }
            catch(ex) {
                reject(ex);
            }
        });
    }
    /**
    * Checks to see if the repo directory exists
    * @function
    */
    function checkForDirectory(path) {
        return new promise(function (resolve, reject) {
            node_fs.stat(path, function(err, stat) {
              if (!!err) {
                  resolve(false);
              }
              else {
                  resolve(
                      stat.isDirectory()
                  );
              }
            });
        });
    }
    /**
    * @function
    */
    function cloneRepo(url, localPath) {
        return new promise(function (resolve, reject) {
            gitDriver(
                localPath
            )
            .clone(url, localPath, [], function (err) {
                if (!!err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
    * @function
    */
    function fetchUpdates(localPath) {
        return new promise(function (resolve, reject) {
            gitDriver(
                localPath
            )
            .fetch("--all", function (err) {
                if (!!err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
    * @function
    */
    function checkout(repoMeta, localPath) {
        return new promise(function (resolve, reject) {
            var cmd = repoMeta.branch;

            gitDriver(
                localPath
            )
            .checkout(cmd, function (err) {
                if (!!err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
}