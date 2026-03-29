require("./load-env");
const { getMongoClient } = require("./mongodb");
const { ObjectId } = require("mongodb");

function applyCorsHeaders(req, res) {
  const origin = req.headers?.origin;
  const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

async function getDb() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DATABASE || "learnhtml");
}

async function ensureForumIndexes(db) {
  const collections = {
    forumPosts: ["authorId", "createdAt", "title"],
    forumComments: ["postId", "authorId", "createdAt"],
    forumMessages: ["senderId", "recipientId", "createdAt"]
  };

  for (const [collection, fields] of Object.entries(collections)) {
    const coll = db.collection(collection);
    for (const field of fields) {
      if (field === "createdAt") {
        await coll.createIndex({ [field]: -1 }).catch(() => {});
      } else {
        await coll.createIndex({ [field]: 1 }).catch(() => {});
      }
    }
  }
}

// Forum Posts
async function createPost(userId, userName, title, content, category = "general") {
  const db = await getDb();
  await ensureForumIndexes(db);

  const post = {
    _id: new ObjectId(),
    authorId: userId,
    authorName: userName,
    title,
    content,
    category,
    createdAt: new Date(),
    updatedAt: new Date(),
    likes: 0,
    viewCount: 0
  };

  await db.collection("forumPosts").insertOne(post);
  return post;
}

async function getPosts(category = null, limit = 20, skip = 0) {
  const db = await getDb();
  const query = category ? { category } : {};
  const posts = await db
    .collection("forumPosts")
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return posts;
}

async function getPostById(postId) {
  const db = await getDb();
  const post = await db
    .collection("forumPosts")
    .findOne({ _id: new ObjectId(postId) });

  if (post) {
    await db
      .collection("forumPosts")
      .updateOne({ _id: new ObjectId(postId) }, { $inc: { viewCount: 1 } });
  }

  return post;
}

async function updatePost(postId, userId, updates) {
  const db = await getDb();
  const post = await db
    .collection("forumPosts")
    .findOne({ _id: new ObjectId(postId) });

  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Unauthorized");

  const result = await db
    .collection("forumPosts")
    .findOneAndUpdate(
      { _id: new ObjectId(postId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

  return result.value;
}

async function deletePost(postId, userId) {
  const db = await getDb();
  const post = await db
    .collection("forumPosts")
    .findOne({ _id: new ObjectId(postId) });

  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Unauthorized");

  await db.collection("forumPosts").deleteOne({ _id: new ObjectId(postId) });
  await db.collection("forumComments").deleteMany({ postId: postId.toString() });

  return { success: true };
}

// Comments
async function createComment(postId, userId, userName, content) {
  const db = await getDb();

  const post = await db
    .collection("forumPosts")
    .findOne({ _id: new ObjectId(postId) });
  if (!post) throw new Error("Post not found");

  const comment = {
    _id: new ObjectId(),
    postId: postId.toString(),
    authorId: userId,
    authorName: userName,
    content,
    createdAt: new Date(),
    likes: 0
  };

  await db.collection("forumComments").insertOne(comment);
  return comment;
}

async function getComments(postId, limit = 50, skip = 0) {
  const db = await getDb();
  const comments = await db
    .collection("forumComments")
    .find({ postId: postId.toString() })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return comments;
}

async function updateComment(commentId, userId, content) {
  const db = await getDb();
  const comment = await db
    .collection("forumComments")
    .findOne({ _id: new ObjectId(commentId) });

  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId) throw new Error("Unauthorized");

  const result = await db
    .collection("forumComments")
    .findOneAndUpdate(
      { _id: new ObjectId(commentId) },
      { $set: { content, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

  return result.value;
}

async function deleteComment(commentId, userId) {
  const db = await getDb();
  const comment = await db
    .collection("forumComments")
    .findOne({ _id: new ObjectId(commentId) });

  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId) throw new Error("Unauthorized");

  await db.collection("forumComments").deleteOne({ _id: new ObjectId(commentId) });
  return { success: true };
}

// Direct Messages
async function sendMessage(senderId, senderName, recipientId, content) {
  const db = await getDb();

  const message = {
    _id: new ObjectId(),
    senderId,
    senderName,
    recipientId,
    content,
    createdAt: new Date(),
    read: false
  };

  await db.collection("forumMessages").insertOne(message);
  return message;
}

async function getMessages(userId, otherUserId) {
  const db = await getDb();
  const messages = await db
    .collection("forumMessages")
    .find({
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .toArray();

  return messages;
}

async function getConversations(userId) {
  const db = await getDb();
  const messages = await db
    .collection("forumMessages")
    .find({
      $or: [{ senderId: userId }, { recipientId: userId }]
    })
    .sort({ createdAt: -1 })
    .toArray();

  const conversations = {};
  messages.forEach((msg) => {
    const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;
    const otherName = msg.senderId === userId ? msg.senderName : msg.senderName;
    if (!conversations[otherId]) {
      conversations[otherId] = {
        userId: otherId,
        userName: otherName,
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt,
        unread:
          msg.recipientId === userId && !msg.read
            ? (conversations[otherId]?.unread || 0) + 1
            : 0
      };
    }
  });

  return Object.values(conversations).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
}

async function markMessagesAsRead(userId, senderId) {
  const db = await getDb();
  await db
    .collection("forumMessages")
    .updateMany(
      { senderId, recipientId: userId, read: false },
      { $set: { read: true } }
    );
}

module.exports = {
  applyCorsHeaders,
  sendJson,
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  createComment,
  getComments,
  updateComment,
  deleteComment,
  sendMessage,
  getMessages,
  getConversations,
  markMessagesAsRead
};
