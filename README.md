# readme-docs

Action to upload docs to readme.com.

## Configuration

> See [action.yml](./action.yml) for more info.

```
- name: Upload docs
  uses: bengreenier-actions/readme-docs@v1.0.0
  with:
    # Your readme.com API Key (required)
    apiKey: '<your_api_key>'
    # Your readme.com project version you wish to upload docs into (required)
    version: 'v1.0.0'
    # The category slug to upload docs into (required)
    categorySlug: 'important-docs'
    # The parent doc slug to upload docs into. Must be a doc under the categorySlug category (optional)
    parentSlug: 'important-doc'
    # The file path(s) to upload. Globs supported (optional)
    # path: ''
    # The regex we run for each file to determine the doc title (optional)
    # titleRegex: '#(.+)?'
    # The prefix we prepend to each title (optional)
    # titlePrefix: ''
    # Json string to base requests off of (optional)
    # additionalJson: '{}'
    # Flag indicating if we should create new docs (optional)
    # create: 'true'
    # Flag indicating if we should overwrite existing docs (optional)
    # overwrite: 'false'
    # Flag indicating if we should clear the category of docs before creation (optional)
    # clear: 'false'
```
