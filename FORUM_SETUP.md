# Community Forum Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 2. Installation

```bash
# Navigate to project directory
cd learnhtmlforfree

# Install dependencies
npm install

# Add required dependencies if not already installed
npm install express mongodb
```

### 3. Environment Configuration

Create a `.env` file in the root directory with:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=learnhtml

# Server
PORT=3000
NODE_ENV=development
```

For MongoDB Atlas (Cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=learnhtml
```

### 4. Start the Server

```bash
# Development mode
npm start

# Or use the provided command
node server.js
```

The server will run on `http://localhost:3000`

### 5. Access the Forum

1. Open your browser to `http://localhost:3000/auth.html`
2. Create a new account or sign in
3. You'll be automatically redirected to `forum.html`
4. Start participating!

---

## Database Setup

The forum automatically creates the required MongoDB collections:

### Collections Created

1. **forumPosts**
   - Stores all forum posts
   - Indexed by: authorId, createdAt, title

2. **forumComments**
   - Stores all comments on posts
   - Indexed by: postId, authorId, createdAt

3. **forumMessages**
   - Stores direct messages between users
   - Indexed by: senderId, recipientId, createdAt

4. **users** (already exists)
   - Stores user account information

---

## File Structure

```
learnhtmlforfree/
├── api/
│   └── forum.js              # Forum API endpoint handler
├── lib/
│   ├── forum-service.js      # Forum business logic
│   └── auth-service.js       # Authentication logic
├── forum.html                # Main forum interface
├── auth.html                 # Authentication page
├── server.js                 # Express server
├── package.json              # Dependencies
├── FORUM_GUIDE.md            # User guide
└── FORUM_SETUP.md            # This file
```

---

## Features Implementation

### Forum System (`/api/forum/*`)

The forum is fully integrated with the existing authentication system:

- **Authentication**: Uses existing user database
- **Authorization**: Only authenticated users can access
- **Database**: Uses existing MongoDB connection
- **API Style**: RESTful endpoints at `/api/forum/*`

### Database Schema

#### forumPosts
```javascript
{
  _id: ObjectId,
  authorId: String,           // User ID
  authorName: String,         // User name
  title: String,
  content: String,
  category: String,           // general|html|css|javascript|react|help
  createdAt: Date,
  updatedAt: Date,
  likes: Number,
  viewCount: Number
}
```

#### forumComments
```javascript
{
  _id: ObjectId,
  postId: String,             // Post ID as string
  authorId: String,           // User ID
  authorName: String,
  content: String,
  createdAt: Date,
  likes: Number
}
```

#### forumMessages
```javascript
{
  _id: ObjectId,
  senderId: String,           // Sender User ID
  senderName: String,
  recipientId: String,        // Recipient User ID
  content: String,
  createdAt: Date,
  read: Boolean
}
```

---

## API Endpoints Reference

### Posts

#### Get All Posts
```
GET /api/forum/posts?category=general
Headers: Authorization: Bearer <token>
Response: { posts: [...] }
```

#### Create Post
```
POST /api/forum/posts
Headers: Authorization: Bearer <token>
Body: {
  title: string,
  content: string,
  category: string
}
Response: { post: {...} }
```

#### Get Single Post
```
GET /api/forum/posts/:id
Headers: Authorization: Bearer <token>
Response: { post: {...} }
```

#### Update Post
```
PUT /api/forum/posts/:id
Headers: Authorization: Bearer <token>
Body: { title?, content?, category? }
Response: { post: {...} }
```

#### Delete Post
```
DELETE /api/forum/posts/:id
Headers: Authorization: Bearer <token>
Response: { success: true }
```

### Comments

#### Add Comment
```
POST /api/forum/posts/:id/comments
Headers: Authorization: Bearer <token>
Body: { content: string }
Response: { comment: {...} }
```

#### Get Comments
```
GET /api/forum/posts/:id/comments
Headers: Authorization: Bearer <token>
Response: { comments: [...] }
```

#### Update Comment
```
PUT /api/forum/comments/:id
Headers: Authorization: Bearer <token>
Body: { content: string }
Response: { comment: {...} }
```

#### Delete Comment
```
DELETE /api/forum/comments/:id
Headers: Authorization: Bearer <token>
Response: { success: true }
```

### Messages

#### Send Message
```
POST /api/forum/messages
Headers: Authorization: Bearer <token>
Body: {
  recipientId: string,
  content: string
}
Response: { message: {...} }
```

#### Get Messages with User
```
GET /api/forum/messages/:userId
Headers: Authorization: Bearer <token>
Response: { messages: [...] }
```

#### Get Conversations
```
GET /api/forum/conversations
Headers: Authorization: Bearer <token>
Response: { conversations: [...] }
```

---

## Authentication Flow

1. User signs up/in via `auth.html`
2. Credentials sent to `/api/signin` or `/api/signup`
3. Server returns user info with ID
4. Frontend encodes user info as base64 JSON: `btoa(JSON.stringify({id, name, email}))`
5. Token stored in `localStorage.setItem('auth', token)`
6. Forum reads token from localStorage on each request
7. Token passed to API as `Authorization: Bearer <token>`
8. Server decodes and validates token on each request

---

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database name is correct

### Port Already in Use
```bash
# Change PORT in .env or use:
PORT=3001 npm start
```

### Auth Token Issues
- Clear browser localStorage: `localStorage.clear()`
- Sign out and sign back in
- Check browser console for errors

### Posts Not Saving
- Check MongoDB connection
- Verify user is authenticated
- Check browser console for API errors

### CORS Errors
- CORS is configured in `forum-service.js`
- Ensure requests are from allowed origins
- For local development, `localhost` and `127.0.0.1` are allowed

---

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import repository in Vercel
3. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `MONGODB_DATABASE`: Your database name
4. Deploy!

### Local Testing Before Deployment

```bash
# Test with production settings
NODE_ENV=production npm start
```

---

## Performance Tips

1. **Index Optimization**: Forum automatically creates indexes on frequently queried fields
2. **Pagination**: Implement pagination for large post lists
3. **Caching**: Consider caching popular posts
4. **Database**: Monitor MongoDB performance for large user bases

---

## Security Considerations

- ✅ Passwords are hashed before storage
- ✅ Auth tokens are base64-encoded (not encrypted - consider JWT in production)
- ✅ User authorization checked on each request
- ✅ SQL injection not possible (MongoDB still needs input validation)
- ⚠️ TODO: Implement rate limiting
- ⚠️ TODO: Add CSRF protection
- ⚠️ TODO: Implement proper JWT tokens

---

## Monitoring & Logging

Add logging to track:
- User authentication events
- Post creation/deletion
- Message activity
- API errors

---

## Support & Debugging

### Enable Debug Mode
Add debug logging to `forum-service.js` and `api/forum.js`:

```javascript
console.log('Creating post:', { userId, title, category });
console.log('Message sent:', { senderId, recipientId });
```

### Check Server Health
```
GET http://localhost:3000/api/health
```

---

## Next Steps

1. ✅ Setup MongoDB connection
2. ✅ Install dependencies
3. ✅ Configuration
4. ✅ Start server
5. ✅ Create account
6. ✅ Access forum
7. ✅ Start a discussion!

---

**Happy building! 🚀**
