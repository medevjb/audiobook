# Product Requirements Document — Local Multilingual Audiobook Reader

**Version:** 1.0
**Product Type:** Local-first web application
**Initial Platform:** Desktop web browser
**Primary Goal:** Convert PDF books into spoken audiobooks locally, with page selection, multilingual voices, playback controls, and zero required paid APIs.

---

## 1. Product Overview

Build a local-first web application that allows a user to upload a PDF book and listen to its text using text-to-speech.

The application must allow the user to:

* Upload a PDF from their computer.
* View the PDF inside the application.
* Select any page as the starting point.
* Listen to the text on that page.
* Automatically continue to following pages.
* Pause, resume, stop, skip forward, and skip backward.
* Change reading speed.
* Select different available voices.
* Select a language.
* Support popular languages including:

  * English
  * Bengali
  * French
  * Chinese
  * Spanish
  * German
  * Hindi
  * Arabic
  * Japanese
  * Other languages supported by the user's browser/device.
* Remember reading progress.
* Work locally without requiring cloud APIs.
* Remain usable without a paid service.

The first version must run entirely in the browser.

---

# 2. Product Vision

The application should feel like an audiobook player built around a PDF reader.

A user should be able to open the application, select a book, choose a page and immediately start listening.

The experience should be simple enough that a non-technical user can use it without configuring API keys, installing AI models, creating accounts, or paying for a service.

---

# 3. Primary Product Principles

The product must follow these principles.

### 3.1 Local First

PDF files should remain on the user's device.

V1 must not upload books to an external server.

### 3.2 Free to Operate

The core application must not depend on:

* OpenAI API
* Google Cloud TTS
* AWS Polly
* ElevenLabs
* Azure Speech
* Any other paid API

Browser-native speech synthesis should be used for V1.

### 3.3 Privacy

Book contents should not leave the user's device during normal use.

### 3.4 Multilingual

The architecture must not assume English-only text.

Language and voice selection must be first-class product features.

### 3.5 Future Extensibility

The speech subsystem must be designed so browser TTS can later be replaced or supplemented by a local neural TTS engine.

---

# 4. Target Users

## Primary User

A person who has PDF books and wants to listen to them instead of reading them manually.

Typical scenarios:

* Students listening to textbooks.
* Readers listening while commuting or doing other tasks.
* People with visual accessibility needs.
* Language learners.
* Users reading books written in Bengali, English, French, Chinese, Hindi, or other languages.
* Users who do not want to pay for audiobook services.

---

# 5. Technology Stack

The following stack should be used for V1 unless a technical limitation makes a change necessary.

## Frontend

* React
* TypeScript
* Vite

## Styling

Preferred:

* Tailwind CSS

Alternative:

* CSS Modules

Do not introduce a large component framework unless necessary.

## PDF Processing

Use:

* PDF.js

Responsibilities:

* Load PDF files.
* Determine total page count.
* Render PDF pages.
* Extract text from individual pages.

## Text-to-Speech

Use the browser:

* Web Speech API
* `window.speechSynthesis`
* `SpeechSynthesisUtterance`

Responsibilities:

* Speak extracted text.
* Select voice.
* Set language.
* Set playback rate.
* Pause.
* Resume.
* Stop.

## OCR

Use:

* Tesseract.js

OCR should be treated as a fallback for scanned/image-only PDF pages.

OCR may be implemented after standard text-based PDF reading works correctly.

## Local Storage

Use:

* localStorage for small preferences.
* IndexedDB where larger persistent data is required.

V1 does not require an external database.

---

# 6. Explicit Technical Constraints

The AI coding agent must follow these constraints.

1. Do not add a backend for V1.
2. Do not add authentication.
3. Do not add cloud storage.
4. Do not use paid APIs.
5. Do not upload PDFs externally.
6. Do not require Docker.
7. Do not require Python for V1.
8. Do not use server-side PDF parsing.
9. Do not implement DRM.
10. Do not implement payment functionality.
11. Do not implement account creation.
12. Do not build mobile-native applications in V1.
13. Keep speech functionality behind a clearly defined TTS abstraction so another TTS engine can be added later.

---

# 7. Core User Flow

The primary user flow is:

1. User opens application.
2. User sees an empty library/reader state.
3. User clicks **Upload PDF**.
4. User selects a `.pdf` file.
5. Application loads the PDF locally.
6. Application determines the number of pages.
7. First page is displayed.
8. Application extracts text from the current page.
9. User selects:

   * starting page
   * language
   * voice
   * playback speed
10. User clicks **Play**.
11. Application reads the page.
12. When the page finishes:

* move to next page
* extract next page text
* continue reading

13. User can pause or stop at any time.
14. Reading progress is saved locally.
15. When reopening the book, the user can continue from the saved page.

---

# 8. Main Screens

V1 should preferably be a single-page application with two major states.

## 8.1 Empty/Home State

Show:

* Application name/logo.
* Short description.
* Large **Upload PDF** button.
* Drag-and-drop upload area.
* Privacy message.

Example privacy message:

"Your PDF stays on your device."

---

## 8.2 Reader State

The screen should contain three functional areas.

### PDF Viewer

Display:

* Current PDF page.
* Previous page button.
* Next page button.
* Current page.
* Total pages.

Example:

`Page 34 / 287`

### Audiobook Controls

Display:

* Play
* Pause
* Resume
* Stop
* Previous page
* Next page

### Reading Settings

Display:

* Start page
* Language
* Voice
* Speed
* Auto-advance setting

---

# 9. PDF Upload Requirements

## Functional Requirements

The user must be able to:

* Click a file picker.
* Select a `.pdf`.
* Drag and drop a PDF.

After selection, the app must:

* Validate that the file is a PDF.
* Load the file.
* Display its filename.
* Determine page count.
* Render the first page.
* Extract text from the first page.

## Error Conditions

Show useful errors for:

* Invalid file type.
* Corrupted PDF.
* Password-protected PDF.
* PDF.js parsing failure.
* Empty PDF.
* Unsupported PDF.

The application must not crash when PDF loading fails.

---

# 10. PDF Viewer Requirements

The PDF viewer must display the currently selected page.

Required controls:

* Previous page
* Next page
* Page number input
* Total page count

Changing pages manually must:

1. Stop current speech.
2. Render the requested page.
3. Extract text for that page.
4. Update reading progress.

The user must not be able to select:

* page 0
* negative pages
* pages above total page count

Invalid input should automatically be clamped or rejected.

---

# 11. Text Extraction Requirements

For every selected page:

1. Get the page from PDF.js.
2. Extract its text items.
3. Convert text items into readable text.
4. Preserve reasonable sentence and paragraph spacing.
5. Remove obviously duplicated whitespace.

The extraction layer should return a clean string.

Recommended internal API:

```ts
extractPageText(pageNumber: number): Promise<string>
```

Do not tightly couple PDF parsing directly to the speech UI.

---

# 12. Scanned PDF Detection

A page should be considered potentially scanned if PDF.js returns no usable text or extremely little text.

Example logic:

```text
Extract text
     |
     v
Is useful text available?
   /   \
 Yes    No
 |       |
Read    OCR fallback
```

For the initial MVP, displaying:

"No readable text was detected on this page."

is acceptable.

OCR should be implemented as a later V1 milestone using Tesseract.js.

---

# 13. OCR Requirements

When OCR support is implemented:

1. Render the selected PDF page to canvas.
2. Send the page image to Tesseract.js.
3. Use the selected OCR language where available.
4. Extract text.
5. Clean OCR output.
6. Pass OCR text to the same TTS pipeline.

Show visible status while OCR is running.

Example:

`Recognizing text on page 42…`

OCR must not freeze the UI.

---

# 14. Speech Engine Architecture

Create a speech abstraction instead of calling `speechSynthesis` throughout React components.

Recommended interface:

```ts
interface TTSProvider {
  speak(text: string, options: SpeechOptions): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getVoices(): Voice[];
}
```

Browser speech should be implemented as:

```text
BrowserTTSProvider
```

Future engines might include:

```text
LocalNeuralTTSProvider
ServerTTSProvider
```

Do not implement the future providers in V1.

---

# 15. Speech Chunking

Do not send an entire large book or very large page directly into one speech utterance.

Long text must be divided into chunks.

Preferred chunk boundaries:

1. Paragraph.
2. Sentence.
3. Safe character length fallback.

The system must preserve reading order.

Example:

```text
Page text
   ↓
Normalize text
   ↓
Split into sentences/chunks
   ↓
Speak chunk 1
   ↓
Speak chunk 2
   ↓
...
   ↓
Page complete
```

This is important for:

* Pause/resume reliability.
* Browser compatibility.
* Highlighting.
* Progress tracking.
* Avoiding long utterance failures.

---

# 16. Playback Controls

The reader must implement:

## Play

Starts reading from the current page.

## Pause

Pauses speech.

## Resume

Continues paused speech.

## Stop

Immediately stops speech.

## Previous Page

Stops current speech and moves to previous page.

## Next Page

Stops current speech and moves to next page.

---

# 17. Auto Page Advance

The user should be able to enable:

`Auto continue to next page`

When enabled:

1. Finish all chunks on current page.
2. Increment current page.
3. Render next page.
4. Extract its text.
5. Start speaking automatically.

Stop automatically after the final page.

When disabled:

Stop speech after the current page.

Default:

Enabled.

---

# 18. Start From Page Feature

The application must provide a numeric page input.

Example:

`Start from page: [57]`

If the user chooses page 57:

1. Stop existing speech.
2. Navigate to page 57.
3. Extract page 57 text.
4. Update viewer.
5. Start speech when the user presses Play.

Optional enhancement:

A **Go & Play** button can perform navigation and playback simultaneously.

---

# 19. Playback Speed

Required speeds:

* 0.5×
* 0.75×
* 1.0×
* 1.25×
* 1.5×
* 1.75×
* 2.0×

Default:

`1.0×`

The selected value must map to:

```ts
SpeechSynthesisUtterance.rate
```

The app should remember the user's selected speed.

---

# 20. Voice Selection

The application must retrieve available browser voices.

Use:

```ts
speechSynthesis.getVoices()
```

The app must handle browsers where voices become available asynchronously.

Listen for:

```ts
voiceschanged
```

Voice selector should display useful labels such as:

`Google UK English Female — en-GB`

or:

`Microsoft David — en-US`

If available.

The selected voice should be remembered locally.

---

# 21. Language Selection

The application should provide common languages.

Initial language list:

| Language   | Code |
| ---------- | ---- |
| English    | en   |
| Bengali    | bn   |
| French     | fr   |
| Chinese    | zh   |
| Spanish    | es   |
| German     | de   |
| Hindi      | hi   |
| Arabic     | ar   |
| Japanese   | ja   |
| Portuguese | pt   |
| Italian    | it   |
| Korean     | ko   |

Selecting a language should filter or prioritize matching voices.

For example:

Selecting:

`Bengali`

should prioritize voices whose language starts with:

`bn`

Selecting:

`French`

should prioritize:

`fr`

Do not assume a browser has a voice installed for every supported language.

---

# 22. Missing Voice Behavior

If no matching voice exists:

Show:

`No Bengali voice is available on this device.`

The app may offer:

`Show all available voices`

The app must not silently pretend a Bengali voice exists.

---

# 23. Text Highlighting

Preferred V1 functionality:

Display the text currently being spoken in a reading-text panel.

Highlight either:

* current sentence, or
* current speech chunk.

Exact per-word synchronization is not required.

Required:

Current chunk highlighting.

Optional:

Per-word highlighting.

---

# 24. Reading Text Panel

In addition to the PDF viewer, include an optional extracted-text panel.

The panel should show text extracted from the selected page.

Reasons:

* Makes extraction errors visible.
* Helps accessibility.
* Enables speech highlighting.
* Helps OCR debugging.

Allow the panel to be collapsed.

---

# 25. Reading Progress

Persist:

* Book identifier.
* Filename.
* Current page.
* Total pages.
* Language.
* Voice.
* Speed.
* Auto-advance state.

When the same book is opened again, show:

`Continue from page 57`

The user should also be able to restart from page 1.

---

# 26. Book Identification

Do not identify books using filename alone.

Two different books can have the same filename.

Create a lightweight local identifier using information such as:

* filename
* file size
* last modified timestamp

Optional later improvement:

Generate a cryptographic hash.

---

# 27. Local Storage Structure

Suggested preferences structure:

```ts
interface UserPreferences {
  language: string;
  voiceURI?: string;
  rate: number;
  autoAdvance: boolean;
}
```

Suggested progress structure:

```ts
interface BookProgress {
  bookId: string;
  filename: string;
  currentPage: number;
  totalPages: number;
  updatedAt: number;
}
```

---

# 28. State Management

Avoid introducing Redux unless the application becomes complex enough to require it.

Recommended V1 options:

* React Context + hooks

or:

* Zustand

If using Zustand, keep stores separated by domain.

Suggested domains:

```text
book
reader
speech
preferences
```

---

# 29. Suggested Application Architecture

```text
Application
│
├── Book Loader
│     └── PDF upload
│
├── PDF Service
│     ├── load document
│     ├── render page
│     └── extract text
│
├── OCR Service
│     └── scanned-page recognition
│
├── Reader Engine
│     ├── page selection
│     ├── chunk navigation
│     └── auto advance
│
├── TTS Engine
│     ├── voices
│     ├── play
│     ├── pause
│     ├── resume
│     └── stop
│
├── Persistence
│     ├── preferences
│     └── progress
│
└── UI
      ├── PDF viewer
      ├── player controls
      ├── language selector
      ├── voice selector
      └── progress display
```

---

# 30. Recommended Folder Structure

```text
src/
│
├── app/
│   └── App.tsx
│
├── components/
│   ├── Upload/
│   │   ├── PdfUploader.tsx
│   │   └── DropZone.tsx
│   │
│   ├── PdfViewer/
│   │   ├── PdfViewer.tsx
│   │   ├── PageNavigation.tsx
│   │   └── PageCanvas.tsx
│   │
│   ├── Player/
│   │   ├── PlayerControls.tsx
│   │   ├── SpeedControl.tsx
│   │   └── ReadingProgress.tsx
│   │
│   ├── SpeechSettings/
│   │   ├── LanguageSelector.tsx
│   │   └── VoiceSelector.tsx
│   │
│   └── ReaderText/
│       └── ReaderText.tsx
│
├── services/
│   ├── pdf/
│   │   ├── pdfService.ts
│   │   └── textExtractor.ts
│   │
│   ├── speech/
│   │   ├── types.ts
│   │   ├── BrowserTTSProvider.ts
│   │   └── textChunker.ts
│   │
│   ├── ocr/
│   │   └── ocrService.ts
│   │
│   └── storage/
│       ├── preferencesStorage.ts
│       └── progressStorage.ts
│
├── hooks/
│   ├── usePdf.ts
│   ├── useSpeech.ts
│   └── useReadingProgress.ts
│
├── store/
│   ├── readerStore.ts
│   └── preferencesStore.ts
│
├── types/
│   ├── book.ts
│   └── reader.ts
│
└── utils/
    ├── language.ts
    └── file.ts
```

Files should remain small and domain-focused.

Do not place the entire application inside `App.tsx`.

---

# 31. User Interface Requirements

The UI should be:

* Clean.
* Minimal.
* Desktop-first.
* Responsive.
* Accessible.
* Easy to understand without instructions.

Suggested layout:

```text
┌───────────────────────────────────────────────────────────┐
│ Audiobook Reader                         Upload New PDF    │
├──────────────────────────────────┬────────────────────────┤
│                                  │ Book                   │
│                                  │ example.pdf            │
│                                  │                        │
│          PDF VIEWER              │ Page                   │
│                                  │ [ 57 ] / 324           │
│                                  │                        │
│                                  │ Language               │
│                                  │ [ Bengali ▼ ]          │
│                                  │                        │
│                                  │ Voice                  │
│                                  │ [ Voice ▼ ]            │
│                                  │                        │
│                                  │ Speed                  │
│                                  │ [ 1.0× ▼ ]             │
│                                  │                        │
│                                  │ [◀] [Play] [Pause] [▶] │
│                                  │                        │
│                                  │ ☑ Auto next page       │
├──────────────────────────────────┴────────────────────────┤
│ Currently reading page 57                                │
└───────────────────────────────────────────────────────────┘
```

---

# 32. Responsive Behavior

Desktop:

Use a two-column reader layout.

Tablet:

Reduce PDF/control column ratios.

Mobile:

Stack:

```text
PDF
↓
Controls
↓
Extracted text
```

A native mobile app is not part of V1.

---

# 33. Accessibility

The application should:

* Use semantic HTML.
* Provide button labels.
* Support keyboard navigation.
* Maintain adequate contrast.
* Provide visible focus states.
* Avoid controls that require mouse-only interaction.

Buttons must include accessible labels such as:

* Play
* Pause
* Stop
* Previous page
* Next page

---

# 34. Keyboard Shortcuts

Preferred shortcuts:

| Key         | Action         |
| ----------- | -------------- |
| Space       | Play/Pause     |
| Right Arrow | Next page      |
| Left Arrow  | Previous page  |
| Escape      | Stop           |
| `+`         | Increase speed |
| `-`         | Decrease speed |

Keyboard shortcuts should not trigger while the user is typing inside an input.

---

# 35. Error Handling

The application must handle:

### PDF errors

* Corrupt PDF.
* Unsupported PDF.
* Password-protected PDF.

### Speech errors

* No voices available.
* Selected voice disappears.
* Speech synthesis failure.

### Text errors

* Empty page.
* Scanned page.
* Extraction failure.

### OCR errors

* OCR worker failure.
* Unsupported OCR language.
* Memory issues.

The app should display recoverable errors rather than crash.

---

# 36. Loading States

Provide status messages for:

### PDF Loading

`Loading PDF…`

### Text Extraction

`Preparing page…`

### OCR

`Recognizing text…`

### Voice Loading

`Loading voices…`

Avoid indefinite loading states.

---

# 37. Performance Requirements

The application should not process the entire book when a PDF is uploaded.

Instead:

1. Load document metadata.
2. Process current page.
3. Prefetch text from the next page when useful.

Do not OCR every page at upload time.

OCR should happen:

* on demand
* or shortly before a page needs to be read.

---

# 38. Memory Requirements

Large PDFs can consume significant memory.

The application should avoid:

* Rendering hundreds of pages simultaneously.
* Keeping unnecessary canvases alive.
* Storing complete rendered pages.
* Running multiple OCR jobs at the same time.

Prefer one visible page plus limited prefetching.

---

# 39. Security Requirements

The application must:

* Treat uploaded PDFs as untrusted input.
* Avoid executing content from PDFs.
* Avoid injecting extracted text as raw HTML.
* Render user text safely.
* Avoid external transmission of book content.

Never use:

```tsx
dangerouslySetInnerHTML
```

for extracted book text unless strict sanitization is implemented.

---

# 40. Privacy Requirements

The UI should communicate:

`Your books are processed locally and are not uploaded to our servers.`

For V1 this statement must remain technically true.

If cloud features are introduced later, this messaging must be updated.

---

# 41. Testing Strategy

Use automated tests for core logic.

Recommended:

* Vitest
* React Testing Library

Optional E2E:

* Playwright

---

# 42. Unit Tests

At minimum test:

### Text Chunker

Test:

* Short sentence.
* Multiple sentences.
* Long paragraph.
* Empty string.
* Bengali text.
* French text.
* Chinese text.

### Page Validation

Test:

* Page below 1.
* Page 1.
* Last page.
* Page above maximum.

### Voice Filtering

Test:

* Exact language.
* Language-region match.
* No matching voices.
* Empty voice list.

### Storage

Test:

* Save preferences.
* Load preferences.
* Save reading progress.
* Update reading progress.

---

# 43. Integration Tests

Test:

### PDF → Text

Load a fixture PDF and verify extracted text.

### Text → Speech Queue

Mock speech synthesis and verify chunks execute sequentially.

### Page Completion

Verify:

```text
current page completes
→ next page loads
→ next page speech starts
```

when auto advance is enabled.

---

# 44. End-to-End Acceptance Scenario

The main E2E scenario should be:

1. Open application.
2. Upload sample PDF.
3. PDF renders.
4. Navigate to page 3.
5. Select language.
6. Select voice.
7. Select 1.25× speed.
8. Press Play.
9. Verify speech engine receives page 3 text.
10. Pause.
11. Resume.
12. Move to next page.
13. Stop.
14. Reload application.
15. Reopen same PDF.
16. Verify reading progress is restored.

---

# 45. MVP Definition

The MVP is complete when all of the following work:

* PDF upload.
* PDF page rendering.
* Page count.
* Page navigation.
* Page text extraction.
* Start-from-page functionality.
* Browser text-to-speech.
* Play.
* Pause.
* Resume.
* Stop.
* Previous page.
* Next page.
* Auto page advancement.
* Language selector.
* Voice selector.
* Speed control.
* Current-page progress.
* Local preference storage.
* Local reading-progress storage.
* Basic responsive layout.
* Error handling.

OCR may follow immediately after the core MVP.

---

# 46. Development Milestones

The coding agent must develop the application incrementally.

## Milestone 1 — Project Foundation

Create:

* Vite project.
* React.
* TypeScript.
* Tailwind CSS.
* Testing setup.
* Application layout.

Acceptance:

Application runs locally.

```bash
npm run dev
```

must start the project successfully.

---

## Milestone 2 — PDF Loading

Implement:

* File picker.
* Drag/drop.
* PDF.js integration.
* Page count.
* First-page rendering.

Acceptance:

User can upload and view a normal PDF.

---

## Milestone 3 — PDF Navigation

Implement:

* Previous page.
* Next page.
* Page input.
* Current/total page display.

Acceptance:

User can navigate every valid page.

---

## Milestone 4 — Text Extraction

Implement page-level text extraction.

Acceptance:

Text from a normal text-based PDF is visible in the extracted-text panel.

---

## Milestone 5 — Basic Speech

Implement:

* Browser TTS abstraction.
* Play.
* Stop.

Acceptance:

Current-page extracted text is spoken.

---

## Milestone 6 — Speech Queue

Implement:

* Text normalization.
* Chunking.
* Sequential utterances.

Acceptance:

Long pages read reliably.

---

## Milestone 7 — Player Controls

Implement:

* Play.
* Pause.
* Resume.
* Stop.
* Previous.
* Next.

Acceptance:

Player state remains synchronized with page state.

---

## Milestone 8 — Auto Advance

Implement automatic page reading.

Acceptance:

When one page finishes, the next page begins automatically.

---

## Milestone 9 — Voice and Language

Implement:

* Browser voice discovery.
* Language selection.
* Voice filtering.
* Voice selection.

Acceptance:

Changing the selected voice affects subsequent speech.

---

## Milestone 10 — Speed

Implement playback-rate selection.

Acceptance:

Speed changes apply to subsequent utterances.

---

## Milestone 11 — Persistence

Implement:

* saved preferences
* reading progress

Acceptance:

Refreshing or reopening the book restores previous settings and position.

---

## Milestone 12 — OCR

Integrate Tesseract.js.

Acceptance:

An image-only PDF page can produce readable text and be spoken.

---

## Milestone 13 — Polish

Implement:

* Loading states.
* Error handling.
* Accessibility.
* Keyboard shortcuts.
* Responsive layout.
* Empty states.

---

# 47. Out of Scope for V1

Do not implement these unless explicitly requested later.

* User accounts.
* Login.
* Social authentication.
* Cloud file storage.
* Book sharing.
* Online library.
* Payments.
* Subscriptions.
* DRM.
* Audiobook marketplace.
* Mobile application.
* Native desktop application.
* Voice cloning.
* Paid AI APIs.
* AI summarization.
* AI translation.
* Book recommendations.
* Collaborative annotations.
* Book synchronization between devices.
* Server-side audio generation.
* Full offline neural TTS models.
* Audio-file exporting.

---

# 48. V2 Candidate Features

Potential future functionality includes:

### Local Neural TTS

Add downloadable multilingual models.

Possible architecture:

```text
React
  ↓
Local API
  ↓
Python/FastAPI
  ↓
Neural TTS Model
```

Potential engines can be evaluated at V2 based on:

* language coverage
* voice quality
* CPU requirements
* model size
* licensing

### Additional Features

Potential future features:

* Book library.
* Recently opened books.
* Book covers.
* Bookmarks.
* Notes.
* Search within book.
* Dark mode.
* Sleep timer.
* Sentence navigation.
* Reading statistics.
* Offline PWA.
* Installable desktop experience.
* Local audiobook generation.
* MP3/WAV export.
* Cloud sync.
* User accounts.

These must not complicate V1 architecture unnecessarily.

---

# 49. AI Coding Agent Instructions

When implementing this PRD, the coding agent must follow these rules.

## Rule 1 — Work Incrementally

Implement one milestone at a time.

Do not attempt the entire application in one large change.

## Rule 2 — Maintain Working Software

At the completion of each milestone:

```bash
npm run build
npm run test
```

must pass.

Fix errors before moving to the next milestone.

## Rule 3 — Do Not Change Architecture Without Reason

Do not introduce:

* Next.js
* Express
* NestJS
* Firebase
* Supabase
* PostgreSQL
* MongoDB
* Docker
* Python

unless explicitly requested.

The V1 product is intentionally client-side.

## Rule 4 — Avoid Large Components

If a React component becomes responsible for multiple domains, split it.

`App.tsx` should primarily compose the application.

It should not contain:

* PDF parsing logic
* speech synthesis logic
* OCR logic
* persistence logic

## Rule 5 — Separate Side Effects

Browser APIs should be isolated in service/provider modules.

Examples:

```text
PDF.js → pdfService
speechSynthesis → BrowserTTSProvider
localStorage → storage service
Tesseract → ocrService
```

## Rule 6 — Prefer Type Safety

Do not use `any` unless unavoidable.

Create explicit interfaces for:

* books
* voices
* preferences
* reader state
* speech state

## Rule 7 — Test Business Logic

Functions responsible for:

* chunking
* page validation
* language matching
* progress persistence

must have unit tests.

## Rule 8 — Preserve Privacy

Do not add analytics, remote telemetry, file uploads, or external APIs without explicit approval.

---

# 50. Coding Agent Workflow

For every milestone the AI coding agent should follow this process:

```text
1. Read PRD requirement
       ↓
2. Inspect existing code
       ↓
3. Define files to modify
       ↓
4. Add/update tests
       ↓
5. Implement smallest functional change
       ↓
6. Run tests
       ↓
7. Run TypeScript checks
       ↓
8. Run production build
       ↓
9. Fix failures
       ↓
10. Summarize completed change
```

Do not move to the next milestone while known failures remain.

---

# 51. Required Development Commands

Project should support:

```bash
npm install
npm run dev
npm run build
npm run test
```

Preferred additional command:

```bash
npm run lint
```

All commands should work from the project root.

---

# 52. Definition of Done

V1 is considered complete when:

1. User can open the app locally.
2. User can upload a PDF.
3. PDF remains on the user's device.
4. User can view pages.
5. User can navigate pages.
6. User can choose a specific start page.
7. App extracts text from the selected page.
8. App can read extracted text aloud.
9. User can choose available voices.
10. User can choose a language.
11. User can adjust reading speed.
12. User can pause speech.
13. User can resume speech.
14. User can stop speech.
15. User can move between pages.
16. App can automatically continue to following pages.
17. Progress is saved locally.
18. Preferences are saved locally.
19. Common failures display useful error states.
20. Project builds without TypeScript errors.
21. Automated core tests pass.
22. No paid API is required.
23. No backend is required.
24. No PDF content is uploaded externally.

---

# 53. Success Criteria

The product succeeds when a user can:

```text
Open app
   ↓
Upload book.pdf
   ↓
Select Bengali
   ↓
Choose available Bengali voice
   ↓
Set page 120
   ↓
Set speed 1.25×
   ↓
Press Play
   ↓
Listen to page 120
   ↓
Automatically continue to page 121
   ↓
Pause
   ↓
Resume
   ↓
Close app
   ↓
Return later
   ↓
Continue reading near page 121
```

without:

* creating an account
* providing an API key
* uploading the book
* paying for a service

---

# 54. Most Important Engineering Priorities

When requirements conflict, prioritize in this order:

1. Reliable PDF reading.
2. Reliable speech playback.
3. Correct page navigation.
4. Privacy.
5. Free/local operation.
6. Multilingual voice handling.
7. Reading progress.
8. UX polish.
9. OCR.
10. Future features.

---

# 55. Final Product Requirement

The final V1 should behave like a combination of:

```text
PDF Reader
+
Audiobook Player
+
Browser Text-to-Speech
```

while remaining:

```text
Local
Private
Free
Multilingual
Extensible
```

The implementation should favor simplicity and reliability over unnecessary features.
