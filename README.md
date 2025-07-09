# FitLock - Step Tracker Productivity App

A sleek productivity app that gamifies daily step tracking and gym activity, helping users achieve their fitness goals while boosting productivity through movement breaks and website blocking.

## Features

### Core Functionality
- **Dual Tracking Modes**: Choose between step counting or location-based gym tracking
- **Clean Dashboard**: Visual progress indicators toward user-defined goals with interactive charts
- **Achievement System**: Badges and rewards for hitting milestones
- **Movement Reminders**: Customizable alerts for work session breaks
- **Website Blocking**: Block distracting apps and websites until goals are achieved
- **Strict Mode**: Prevent users from changing blocking settings once enabled

### Step Tracking Mode
- Set daily step goals (1,000 - 30,000 steps)
- Real-time step counting with progress visualization
- Integration with health apps (Apple Health, Google Fit, Fitbit, Samsung Health, Garmin)
- Historical step data with daily, weekly, and monthly views
- Goal achievement calendar with visual indicators

### Location-Based Gym Tracking
- **Google Maps Integration**: Search and select gym locations from Google Maps
- **Precise GPS Coordinates**: Automatic extraction of exact gym coordinates
- **Smart Radius Detection**: Configurable detection radius (50-200 meters) accounting for GPS accuracy and gym size
- **Entry/Exit Tracking**: Precise monitoring of gym visits with session timing
- **Adaptive Accuracy**: GPS accuracy-based radius adjustment for reliable detection
- **Real-time Distance Monitoring**: Live distance calculation to gym location
- **Session Management**: Automatic tracking of gym session duration

### Health App Integration
- Connect to multiple health platforms simultaneously
- Automatic data synchronization (5-60 minute intervals)
- Real-time step data import
- Cross-platform compatibility

### Website & App Blocking
- Customizable lists of blocked websites and applications
- Goal-based unlocking system
- Strict mode to prevent setting modifications
- Real-time blocking status indicators
- Test functionality for blocking verification

### User Interface
- Responsive design for all device sizes
- Real-time progress visualization with circular progress indicators
- Interactive charts and graphs for historical data
- Calendar view with goal achievement highlights
- Collapsible settings panel for easy configuration

## Technical Implementation

### Built With
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts for data visualization
- **Maps**: Google Maps API with Places library
- **Location Services**: HTML5 Geolocation API
- **Data Persistence**: LocalStorage for settings and progress

### Key Services
- **Blocking Service**: Manages website/app blocking logic and goal tracking
- **Health App Service**: Handles integration with various health platforms
- **Location Tracker**: GPS-based gym detection with Google Maps integration

### Google Maps Integration
- Places API for gym search and selection
- Automatic coordinate extraction from selected locations
- Interactive map preview with markers and radius visualization
- Real-time distance calculations using Haversine formula
- GPS accuracy compensation for reliable location detection

## Setup and Configuration

### Prerequisites
- Node.js 18+ and npm/yarn
- Google Maps API key with Places API enabled

### Installation
```bash
npm install
npm run dev
```

### Google Maps API Setup
1. Obtain a Google Maps API key from Google Cloud Console
2. Enable the Maps JavaScript API and Places API
3. The API key is currently embedded in the code (for demo purposes)
4. For production, move the API key to environment variables

### Usage
1. **Choose Tracking Mode**: Select between step counting or gym location tracking
2. **Configure Goals**: Set daily step targets or gym time requirements
3. **Set Up Location** (if using gym mode):
   - Search for your gym using Google Maps integration
   - Select from search results to auto-populate coordinates
   - Adjust detection radius based on gym size (50-200m recommended)
4. **Configure Blocking**: Add websites/apps to block until goals are met
5. **Enable Strict Mode**: Lock settings to prevent modifications
6. **Connect Health Apps**: Link fitness trackers for automatic data sync

## Architecture

### Component Structure
- `Dashboard`: Main interface with progress visualization and status indicators
- `SettingsPanel`: Configuration interface with Google Maps integration
- `LocationTracker`: GPS-based gym detection and session management
- `StepChart`: Historical data visualization with multiple time views
- `BlockingService`: Core logic for goal tracking and website blocking

### Data Flow
1. User configures goals and tracking preferences
2. Location/step data is collected in real-time
3. Progress is compared against configured goals
4. Blocking status is updated based on goal achievement
5. UI reflects current status and progress

## Future Enhancements
- Server-side data synchronization
- Advanced analytics and insights
- Social features and challenges
- Wearable device integration
- Machine learning for personalized recommendations
