## Setup
- setup a project for a SPA with the following stack: TS, react, vite
- setup vite to use relative paths in index.html
- create a package script that creates a tgz file with the following layout:
    - package.json - basic info about the app
    - static - this a folder where the contents of `dist` folder that contains the entire SPA goes
    - default - this is where the contents of `config` directory go
## Special variables
- `CRIBL_API_URL` is the host and base url like `https://localhost:9000/api/v1` which is automagically populated when installed into the cribl framework
- `CRIBL_AUTH_TOKEN` is the auth token for making requests against the cribl api url. This will also be automagically handled when installed into the cribl framework
These will be attached to `window`, if they are not present, fallback to these same variable names in the environment. Ideally, you should build a reusable getter utility for fetching these values as needed.

## Platform APIs
You can find definitions for the endpoints that are hanging off of `CRIBL_API_URL` in openapi.yml. There is one exception, being we have per-pack key value store endpoints that will look like `CRIBL_API_URL/p/vibe-coder/kvstore/the/path/to/the/key`. This endpoint supports:
- set as PUT
- get as GET
- del as DELETE
- listing as POST to `CRIBL_API_URL/p/vibe-coder/kvstore/keys` with a body `{prefix: 'my/key/prefix'}`

## Search jobs API
 
- follow specs from cribl-apidocs.yml and use `/search/jobs/{id}` endpoint
- use `CRIBL_API_URL/m/default_search/search/jobs` as base URL for the jobs endpoint

### Search jobs results API
- use `/search/jobs/{id}/results` endpoint for retrieving job results
- use streaming for reading the ndjson response from the endpoint: first line in the ndjson response contains job info header, followed by the actual results as ndjson

### timeline api
- use `/search/jobs/{id}/timeline` endpoint for retrieving timeline
- here is a sample output from the endpoint:
{
    "buckets": [
        {
            "duration": 60,
            "earliest": 1770281100,
            "eventCount": 6
        },
        {
            "duration": 60,
            "earliest": 1770281160,
            "eventCount": 6
        },
        {
            "duration": 60,
            "earliest": 1770281220,
            "eventCount": 6
        },
        {
            "duration": 60,
            "earliest": 1770281280,
            "eventCount": 6
        },
        {
            "duration": 60,
            "earliest": 1770281340,
            "eventCount": 25
        },
        {
            "duration": 60,
            "earliest": 1770281400,
            "eventCount": 10
        },
       
        {
            "duration": 60,
            "earliest": 1770284580,
            "eventCount": 178
        },
        {
            "duration": 60,
            "earliest": 1770284640,
            "eventCount": 70
        }
    ],
    "totalEventCount": 1000
}


## App requirements

- create a simple app that has one input box, time picker, search button and a list of results
- use Monaco with Kusto language for input
- use ag-grid for displaying results
- when pressing the Search button, the app should do the following
  - create a new search job with the kusto query from input box and time range from the picker as unix timestamps
  - fetch results
  - check the job status in the results header and keep on polling every 1sec until status is one of the following: 'completed', 'failed', 'canceled'
  - display results as a table, create columns based on the fields in events in the results