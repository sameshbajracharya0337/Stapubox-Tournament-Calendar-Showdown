# StapuBox Tournament Calendar Showdown

A React Native mobile application showcasing a sports tournament calendar for August–October 2025. The app features a sports filter dropdown, a custom calendar view with highlighted start dates, and expandable tournament cards with match details, all displayed in Indian Standard Time (IST). Data is fetched from the StapuBox API (or demo API for development).

## Demo Video

Watch the demo here: [Google Drive Demo](https://drive.google.com/file/d/1A2waQ_QAIb2-tprrPPtDmxvSqHWmqcIv/view?usp=sharing)

The video demonstrates:
- Switching sports to update calendar highlights and tournament list
- Tapping dates to filter tournaments starting that day
- Expanding/collapsing tournament cards to view match details
- Handling "no data" states with contextual messages

# Features

- **Sports Filter Dropdown**: Fetches sports list from API with "ALL" as default; searchable with real-time updates to calendar and tournament list.
- **Calendar View**: Custom month view for August–October 2025, highlighting only tournament start dates; date taps filter tournaments.
- **Tournament Cards**: Displays logo (with API/Google Drive/local fallback), name, sport, level (color-coded), and IST date range; includes favorite button.
- **Match Cards**: Shows match details (teams, stage, IST date/time, venue) with sport-specific icons (e.g., 🏸 for badminton).
- **Error Handling**: User-friendly error messages with retry options for API failures.
- **No Data State**: Contextual messages (e.g., "No [sport] tournaments on selected date").
- **Animations**: Smooth expand/collapse with `LayoutAnimation` and `Animated`.
- **Offline Support**: Caches sports and tournament data using AsyncStorage.
- **Pull-to-Refresh**: Refreshes data with a pull gesture in the tournament list

## Project Structure

```
src/
├── components/
│   ├── SportsDropdown.js      # Sports filter dropdown with search and modal
│   ├── CalendarView.js        # Custom calendar with highlighted start dates
│   ├── TournamentCard.js      # Outer card with expand/collapse
│   └── MatchCard.js           # Inner match details card
├── services/
│   └── api.js                 # API service with caching and error handling
├── utils/
│   └── dateHelpers.js         # Date formatting and IST utilities
├── screens/
│   └── TournamentCalendarScreen.js # Main screen orchestrating components
├── assets/                    # Static assets (e.g., tournamentlogo1.png)
└── App.js                     # App entry point
```

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v7 or higher
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`
- **Android Emulator or Device**: Verify with `adb devices`

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/stapubox-tournament-calendar.git
cd stapubox-tournament-calendar
```

### 2. Install Dependencies
```bash
npm install
```

**Installs:**
- react-native
- react-native-vector-icons
- @react-native-async-storage/async-storage
- @react-native-community/netinfo

See `package.json` for full list.

### 3. Link Native Modules
```bash
npx react-native link react-native-vector-icons
```

### 4. Configure Environment

1. Ensure adb is set up for Android devices/emulators:
   ```bash
   export PATH=$PATH:$HOME/Android/Sdk/platform-tools
   ```

2. Verify device/emulator:
   ```bash
   adb devices
   ```

## Run the App

### 1. Start Metro bundler:
```bash
npx react-native start
```

### 2. Run on Android:
```bash
npx react-native run-android
```

## Building the APK

### 1. Configure EAS Build
Ensure `eas.json` exists with:
```json
{
  "build": {
    "apk": {
      "platform": "android",
      "buildType": "apk"
    }
  }
}
```

Log in to Expo:
```bash
eas login
```

### 2. Build APK:
```bash
eas build -p android --profile apk
```

### 3. Download and Install
1. Download APK from the provided URL (e.g., `https://expo.dev/artifacts/eas/6bHEJDdzU6j51viq6VPM9n.apk`)
2. Install APK on your device

## Contributing

Feel free to submit issues and enhancement requests!

