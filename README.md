# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/344cdc19-71b3-40df-92f5-3ebdf96dc220

## Environment Setup

This project uses environment variables for configuration. Follow these steps to set up your environment:

1. Create a `.env` file in the root directory of the project.
2. Use the `.env.example` file as a reference for the required variables.
3. Fill in your specific values for each variable:
   - **Supabase**: Set your Supabase URL and anonymous key
   - **Web3Auth**: Add your client ID and select the network (SAPPHIRE_DEVNET or SAPPHIRE_MAINNET)
   - **Aptos**: The default values for testnet should work, but you can customize if needed
   - **Verifier**: Set the verifier name for Web3Auth

Example:
```
# Supabase configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Web3Auth configuration
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
VITE_WEB3AUTH_NETWORK=SAPPHIRE_DEVNET
```

> **Note:** Since this project uses Vite, environment variables need to be prefixed with `VITE_` to be accessible in the browser.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/344cdc19-71b3-40df-92f5-3ebdf96dc220) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/344cdc19-71b3-40df-92f5-3ebdf96dc220) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
