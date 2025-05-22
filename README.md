# Fequester

Fequester is declarative library for working with API, designed for [@fegorka](https://fegorka.com) services. It enables make HTTP requests, file downloads, error processing, request modification and other necessary functions for services, both in standard and Electron contexts


---

### Installation

Fequester can be installed only from repository

```bash
npm install git+https://github.com/fegorka/fequester#release/<version>
```

Depends on `axios` as a peer dependencies

```bash
npm install axios
```

For `Electron` applications, you may also need

```bash
npm install electron
```


---


### Usage

Fequester provides 3 main entry points: `createFequester` for standalone context, `createElectronMainFequester` for Electron main process, and `createElectronRendererFequester` for Electron renderer process. Each returns a client with methods for HTTP requests (`get`, `post`, `put`, `patch`, `delete`) and file downloads (`download`)

```typescript
// Standalone context

import { createFequester } from 'fequester';
import axios from 'axios';

interface Modifiers // ...

const modifiers: Modifiers = {

  log: (draft) => {
    console.log('Request draft:', draft);
    return draft;
  },

  addHeader: (draft, key: string, value: string) => ({
    ...draft,
    headers: { ...draft.headers, [key]: value },
  })

}

const onErrorActions = {
  401: (error) => console.warn('Unauthorized:', error),
  500: (error) => console.error('Server error:', error),
}

const exampleApi = createFequester(axios, 'https://example.com/api/v1', { 'X-Default': 'some-text' })(modifiers, onErrorActions);

exampleApiClient.get<{ data: string }>('/endpoint', { page: 1 })
  .log()
  .addHeader('X-Custom', 'value')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

exampleApiClient.download('/files/example.zip', '/path/to/save/example.zip')
  .then(() => console.log('Download complete'))
  .catch(error => console.error(error));

```

```typescript
// Electron main process context

import { ipcMain } from 'electron';
import { createElectronMainFequester } from 'fequester';
import axios from 'axios';

interface Modifiers // ...

const modifiers = {

  log: (draft) => {
    console.log('Request draft:', draft);
    return draft;
  },

  addHeader: (draft, key: string, value: string) => ({
    ...draft,
    headers: { ...draft.headers, [key]: value },
  })

}

const onErrorActions = {
  401: (error) => console.warn('Unauthorized:', error),
  500: (error) => console.error('Server error:', error),
}

const exampleApi = createElectronMainFequester(ipcMain, 'api-channel-name', axios, 'https://example.com/api/v1', { 'X-Default': 'some-text' })(modifiers, onErrorActions);

exampleApi.get<{ data: string }>('/endpoint', { page: 1 })
  .log()
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

exampleApi.download('/files/example.zip', '/path/to/save/example.zip')
  .then(() => console.log('Download complete'))
  .catch(error => console.error(error));

```

```typescript
// Electron renderer process context

import { ipcRenderer } from 'electron';
import { createElectronRendererFequester } from 'fequester';

interface Modifiers // ...

const exampleApi = createElectronRendererFequester(ipcRenderer, 'api-channel-name',  { 'X-Default': 'some-text' });

exampleApi.get<{ data: string }>('/endpoint', { page: 1 })
  .log()
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

exampleApi.download('/files/example.zip', '/path/to/save/example.zip')
  .then(() => console.log('Download complete'))
  .catch(error => console.error(error));

```


### Defining Modifiers

Modifiers are functions that alter the request draft (e.g., adding headers or editing params). For Electron, define them in a shared TypeScript type file and import it in both main and renderer processes for correctly typecheking

```typescript
// types/modifiers.ts

import type { RequestDraft } from 'fequester';

export interface Modifiers {
  log: (draft: RequestDraft) => RequestDraft;
  addHeader: (draft: RequestDraft, key: string, value: string) => RequestDraft;
}

```


Import and use this type in both processes:

```typescript
import { Modifiers } from './types/modifiers';

// In main process
const mainClient = createElectronMainFequester<Modifiers>(ipcMain, 'api-channel-name', axios, 'https://example.com/api/v1')(/* ... */);

// In renderer process
const rendererClient = createElectronRendererFequester<Modifiers>(ipcRenderer, 'api-channel-name')(/* ... */);

```


---


### Design Rationale


Electron recommends handling sensitive operations like API requests in main process rather than renderer. Fequester follows this by delegating requests to the main process via IPC, enhancing security

Modifiers can import various modules, for example nodeJS crypto for signing requests, which is not in the browser (but there is window.crypto), in order to avoid conflicts and duplicate code, modifiers are set in the main process and can be accessed from the renderer

Currently, Electron requires a separate modifier type definition (e.g `Modifiers`) passed via generics. Functions cannot be shared directly between processes due to their separation, but TypeScript types can be imported and compiled out, ensuring type safety without runtime dependencies


---

Source code is hosted on GitHub at [fegorka/fequester](https://github.com/fegorka/fequester) under CC BY-NC-ND-4.0 license