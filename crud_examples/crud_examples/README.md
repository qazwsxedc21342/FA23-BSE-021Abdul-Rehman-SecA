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
  - result of MySQL
  - ![WhatsApp Image 2026-02-20 at 8 40 20 AM](https://github.com/user-attachments/assets/a90764ce-c19b-47b9-85d6-fe2678b3b1fd)


### 2. MongoDB CRUD
- **Location**: `mongodb_crud/`
- **Database**: MongoDB
- **Description**: MongoDB database ke saath CRUD operations
- **Features**:
  - NoSQL database implementation
  - Document-based data storage
  - Modern web interface
  - result of MongoDB
  - ![WhatsApp Image 2026-02-20 at 8 40 21 AM (1)](https://github.com/user-attachments/assets/071409d7-a654-44d3-9257-c9bd1a7f7358)


### 3. SQLite CRUD
- **Location**: `sqlite_crud/`
- **Database**: SQLite
- **Description**: SQLite database ke saath lightweight CRUD operations
- **Features**:
  - File-based database
  - No separate server required
  - Simple setup
  - result of SQLite
  - ![WhatsApp Image 2026-02-20 at 8 40 21 AM](https://github.com/user-attachments/assets/90f65f0d-7845-4efa-b176-9c30fd00299b)


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

