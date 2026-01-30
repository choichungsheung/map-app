# Hong Kong Map Application

A React-based interactive map application for exploring Hong Kong districts and marking locations.

## Features

- Interactive map of Hong Kong with district boundaries
- Search functionality to find locations using Hong Kong's map API
- Add custom markers to the map
- Toggle between popups and tooltips for markers
- Color-coded districts by region (Hong Kong Island, Kowloon, New Territories)

## Technologies Used

- React 19
- React Leaflet
- Leaflet
- CSS3

## Local Development

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation

1. Clone this repository
2. Navigate to the project directory: `cd map-app`
3. Install dependencies: `npm install`
4. Start the development server: `npm start`

The application will open in your default browser at `http://localhost:3000`.

## Hosting on GitHub Pages

This application is configured to be hosted on GitHub Pages using GitHub Actions.

### Steps to Host on GitHub Pages:

1. **Create a GitHub Repository:**
   - Go to [GitHub](https://github.com) and create a new repository
   - Name it something like `map-app` or `your-username.github.io`

2. **Push Your Code to GitHub:**
   ```bash
   # Initialize git if not already done
   git init
   
   # Add your GitHub repository as remote
   git remote add origin https://github.com/your-username/your-repo-name.git
   
   # Create main branch
   git branch -M main
   
   # Add files and commit
   git add .
   git commit -m "Initial commit"
   
   # Push to GitHub
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click on "Settings" tab
   - Scroll down to "Pages" section in the left sidebar
   - Under "Source", select "GitHub Actions"
   - Click "Save"

4. **Wait for Deployment:**
   - The GitHub Actions workflow will automatically build and deploy your app
   - Check the "Actions" tab to see the deployment progress
   - Once completed, your app will be available at `https://your-username.github.io/your-repo-name`

### Custom Domain (Optional)

If you want to use a custom domain:

1. Create a `CNAME` file in the `public` folder with your domain name
2. Configure your domain's DNS settings to point to GitHub Pages
3. Update the GitHub Pages settings to use your custom domain

## API Usage

This application uses:
- **Hong Kong Map API** for location search
- **Hong Kong Geodetic Survey API** for coordinate conversion (HK80 to WGS84)

## Project Structure

```
map-app/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   ├── index.css
│   ├── data/
│   │   └── combined_districts.json
│   └── icon/
│       └── map_icon.svg
├── .github/
│   └── workflows/
│       └── deploy.yml
└── package.json
```

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/your-username/your-repo-name/issues) on GitHub.