/**
* @factory
*/
function _CheckoutRepositories(
    promise
    , is
    , buildHelpers_repository
    , reporter
    , errors
) {
    /**
    * @constants
    */
    var cnsts = {
        "repoMetaKeys": "branch,local,type,url"
    };

    /**
    * @worker
    */
    return function CheckoutRepositories(
        entry
        , procDetail
    ) {
        //validate the entry `repos` property
        ///INPUT VALIDATION
        return validateRepoMeta(
            entry
        )
        ///END INPUT VALIDATION
        //then, if we have repos, create a checkout process for each
        .then(function thenCheckoutRepos(repos) {
            if (!repos) {
                return promise.resolve();
            }
            return processRepos(
                repos
                , procDetail
            );
        });

    };

    /**
    * Validates that the repos are an array of `{iRepoMeta}` or undefined
    * @function
    */
    function validateRepoMeta(entry) {
        try {
            //there isn't a repos property
            if (!entry.hasOwnProperty("repos")) {
                return promise.resolve();
            }
            //the repos property should be an array
            if (!is.array(entry.repos)) {
                return promise.reject(
                    new Error(
                        `${errors.invalid_repos_propery} (${typeof entry.repos})`
                    )
                );
            }
            //check the structure of each member
            var valid =
                entry.repos.every((repo, indx)=>{
                    if (
                        !Object.keys(repo).sort() === cnsts.repoMetaKeys
                    ) {
                        badIndx = indx
                        return false;
                    }
                    return true;
                });

            if (!valid) {
                return promise.reject(
                    `${errors.invalid_repo_meta} at index (${badIndx})`
                )
            }

            return promise.resolve(entry.repos);
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
    /**
    * Loops through the repos and creates a repo process for each
    * @function
    */
    function processRepos(repos, procDetail) {
        var procs = [];

        ///LOGGING
        reporter.info(
            `Checking out ${repos.length} repo(s)`
            , procDetail
        );
        ///END LOGGING

        repos.forEach(function forEachRepo(repo) {
            procs.push(
                processRepo(repo)
            );
        });

        return promise.all(
            procs
        )
        ///LOGGING
        .then(function thenReportFinished() {
            reporter.info(
                `Checking out completed`
                , procDetail
            )
            return promise.resolve();
        });
        ///END LOGGING
    }
    /**
    * Resolves the repo type handler and executes it
    * @function
    */
    function processRepo(repo) {
        try {
            var handler = buildHelpers_repository[repo.type];
            if (!handler) {
                return promise.reject(
                    new Error(
                        `${errors.invalid_repo_type} (${repo.type})`
                    )
                );
            }
            //run the handler
            return handler(
                repo
            );
        }
        catch(ex) {
            return promise.reject(ex);
        }
    }
}