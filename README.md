
# SSO Proxy

Authentication proxy using [Opinsys
SSO](https://api.opinsys.fi/v3/sso/developers) for web services not supporting
any other authentication mechanism.


## Config

`/etc/sso-proxy.json`


```json
{
   "targetName": "Target Service Name",
   "target": "http://<target service>",
   "authEndpoint": "https://api.opinsys.fi/v3/sso",
   "sharedSecret": "secret",
   "mountPoint": "http://localhost:1337",
   "allowedOrganisationDomains": ["hogwarts.opinsys.net"]
}
```
