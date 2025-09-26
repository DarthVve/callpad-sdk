# CallPad SDK Demo

A simple React demo application showcasing the CallPad SDK features.

## Features

This demo includes placeholder components for:

- **Video Call Interface**: Main video container for call display
- **Participant Management**: List of call participants with status indicators
- **Call Controls**: Mute, camera, screen share, and leave call buttons
- **Connection Status**: Real-time connection quality monitoring

## Getting Started

### Prerequisites

- Node.js 18+ (compatible with current Node.js 21.6.2)
- pnpm

### Installation

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

The demo will be available at http://localhost:3000

### Build

Build the production version:

```bash
pnpm build
```

### Type Checking

Run TypeScript type checking:

```bash
pnpm check-types
```

## Next Steps

Once the CallPad SDK is ready, you can:

1. Install the SDK: `pnpm add callpad-sdk`
2. Replace placeholder components with actual SDK integration
3. Connect to real video calls and test SDK functionality

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # App header with branding
│   ├── CallDemo.tsx        # Main video call interface
│   ├── ParticipantsPanel.tsx  # Participant list and status
│   └── ControlsPanel.tsx   # Call control buttons
├── App.tsx                 # Main app component
└── main.tsx               # App entry point
```
