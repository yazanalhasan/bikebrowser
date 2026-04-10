# 📚 BikeBrowser Documentation Index

Welcome to BikeBrowser! This index will help you find the right documentation for your needs.

## 🚀 I Want To...

### **Get Started Quickly**
→ Read [GETTING_STARTED.md](GETTING_STARTED.md)
- Complete setup guide from scratch
- Installation troubleshooting
- First-time usage walkthrough

### **Install and Run (2 Minutes)**
→ Read [QUICKSTART.md](QUICKSTART.md)
- Fastest way to get running
- Assumes Node.js is already installed
- Quick command reference

### **Understand the Implementation**
→ Read [STATUS.md](STATUS.md)
- What was built in the MVP
- Feature list and success criteria
- Architecture overview

### **Set Up for Development**
→ Read [SETUP.md](SETUP.md)
- Detailed installation steps
- Troubleshooting guide
- Project structure explanation

### **Learn Technical Details**
→ Read [DEVELOPMENT.md](DEVELOPMENT.md)
- How the ranking algorithm works
- Code architecture and data flow
- Known issues and tech debt
- Development workflow
- Future roadmap

### **Understand the Vision**
→ Read the reconstructed planning document (see conversation history)
- Complete product vision
- System architecture
- Feature roadmap (Phases 1-5)
- UX/UI plans
- Data models

## 📖 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Complete beginner guide | Everyone, especially first-time users |
| [QUICKSTART.md](QUICKSTART.md) | Fast setup reference | Users who already have Node.js |
| [README.md](README.md) | Project overview | Quick reference |
| [STATUS.md](STATUS.md) | Implementation summary | Developers, testers |
| [SETUP.md](SETUP.md) | Detailed installation guide | Developers, troubleshooters |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Technical documentation | Developers |

## 🎯 Quick Commands

### First Time Setup
```bash
# 1. Install Node.js from https://nodejs.org/ first!
# 2. Then run:
npm install
```

### Run the App
```bash
npm run dev
```

Or just **double-click `run.bat`**

### Build for Production
```bash
npm run build
npm run build:electron
```

## 🔍 Where Is...?

**...the main app code?** → `src/main/main.js`

**...the UI components?** → `src/renderer/pages/` and `src/renderer/components/`

**...the ranking algorithm?** → `src/services/rankingEngine.js`

**...the database?** → `data/bikebrowser.db` (auto-created on first run)

**...the trusted channels list?** → In database, see `data/schema.sql` for initial list

**...configuration?** → `package.json`, `vite.config.js`, `tailwind.config.js`

## 🆘 I Need Help With...

### Installation Problems
→ See [GETTING_STARTED.md](GETTING_STARTED.md) → Troubleshooting section

### Search/Ranking Issues
→ See [DEVELOPMENT.md](DEVELOPMENT.md) → Known Issues section

### Understanding the Code
→ See [DEVELOPMENT.md](DEVELOPMENT.md) → File Architecture section

### Adding Features
→ See [DEVELOPMENT.md](DEVELOPMENT.md) → Next Development Steps section

## ✅ Project Status

**Current Phase**: MVP Complete (Sprints 0-4)

**What Works**:
- YouTube search and ranking
- Trust-based scoring
- Child-friendly UI
- Video playback

**Next Phase**: Enhanced ranking and parent controls

For detailed status, see [STATUS.md](STATUS.md)

## 🛠️ Technology Stack

- **Desktop Framework**: Electron 28
- **UI Framework**: React 18
- **Styling**: Tailwind CSS 3
- **Build Tool**: Vite 5
- **Database**: SQLite 3 (better-sqlite3)
- **HTTP Client**: Axios
- **HTML Parser**: Cheerio

## 📞 Getting Support

1. Check the **Console** (Developer Tools) for errors
2. Read the **Troubleshooting** sections in docs
3. Review **Known Issues** in DEVELOPMENT.md
4. Check the planning document for design decisions

## 🎓 Learning Resources

**New to Electron?** → https://www.electronjs.org/docs/latest/

**New to React?** → https://react.dev/learn

**New to Tailwind?** → https://tailwindcss.com/docs

**New to SQLite?** → https://www.sqlite.org/docs.html

---

**Last Updated**: March 22, 2026  
**Version**: 0.1.0  
**License**: MIT
