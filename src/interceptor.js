angular.module('backand')
    .factory('BackandHttpInterceptor', ['$q', 'Backand', 'BackandHttpBufferService', 'BackandAuthService', HttpInterceptor])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('BackandHttpInterceptor');
    }]);

function HttpInterceptor ($q, Backand, BackandHttpBufferService, BackandAuthService) {
    return {
        request: function(httpConfig) {
            // Exclusions
            if (!config.isManagingHttpInterceptor) return httpConfig;
            if (!httpConfig.url.match(Backand.getApiUrl())) return httpConfig;
            if (httpConfig.url.match(Backand.getApiUrl() + '/token')) return httpConfig;

            var t = BKStorage.token.get();
            if (angular.isDefined(t)) {
                httpConfig.headers['Authorization'] = t;
            }
            if (config.anonymousToken) {
                httpConfig.headers['AnonymousToken'] = config.anonymousToken;
            }
            return httpConfig;
        },
        responseError: function (rejection) {
            if (!config.isManagingHttpInterceptor) return rejection;
            if (rejection.config.url !== Backand.getApiUrl() + 'token') {
                if (config.isManagingRefreshToken
                    && rejection.status === 401
                    && rejection.data
                    && rejection.data.Message === 'invalid or expired token') {

                    BackandAuthService.refreshToken(Backand.getUsername());
                    var deferred = $q.defer();
                    BackandHttpBufferService.append(rejection.config, deferred);
                    return deferred.promise;
                }
            }
            return $q.reject(rejection);
        }
    }
}