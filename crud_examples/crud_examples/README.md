# CRUD Examples

Is repository mein alag-alag databases ke saath CRUD (Create, Read, Update, Delete) operations ke examples hain.

## Available Examples

### 1. MySQL CRUD
- **Location**: `mysql_crud/`
- **Database**: MySQL
- **Description**: MySQL database ke saath complete CRUD operations
- **Features**:
  - User management system
  - Create, Read, Update, Delete operations
  - Web-based interface

### 2. MongoDB CRUD
- **Location**: `mongodb_crud/`
- **Database**: MongoDB
- **Description**: MongoDB database ke saath CRUD operations
- **Features**:
  - NoSQL database implementation
  - Document-based data storage
  - Modern web interface

### 3. SQLite CRUD
- **Location**: `sqlite_crud/`
- **Database**: SQLite
- **Description**: SQLite database ke saath lightweight CRUD operations
- **Features**:
  - File-based database
  - No separate server required
  - Simple setup

## Installation

Har example folder mein jaake dependencies install karein:

```bash
cd mysql_crud
npm install
```

Ya

```bash
cd mongodb_crud
npm install
```

Ya

```bash
cd sqlite_crud
npm install
```

## Usage

Har project ko run karne ke liye:

```bash
node server.js
```

Phir browser mein `http://localhost:3000` open karein.

## Requirements

- Node.js (v12 ya usse upar)
- npm
- MySQL (mysql_crud ke liye)
- MongoDB (mongodb_crud ke liye)

## Project Structure

```
crud_examples/
├── mysql_crud/
│   ├── server.js
│   ├── package.json
│   └── public/
│       └── index.html
├── mongodb_crud/
│   ├── server.js
│   ├── package.json
│   └── public/
│       └── index.html
└── sqlite_crud/
    ├── server.js
    ├── package.json
    └── public/
        └── index.html
```

## Contributing

Contributions welcome hain! Pull request submit kar sakte hain.

## License

MIT License
