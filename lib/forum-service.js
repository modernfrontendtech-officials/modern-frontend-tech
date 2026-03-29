require("./load-env");
const { getMongoClient } = require("./mongodb");
const { ObjectId } = require("mongodb");

let forumIndexesPromise = null;
let indexedDatabaseName = null;

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

function getDatabase(client) {
  const databaseName = process.env.MONGODB_DB;
  return databaseName ? client.db(databaseName) : client.db();
}

async function ensureForumIndexes(db) {
  if (forumIndexesPromise && indexedDatabaseName === db.databaseName) {
    return forumIndexesPromise;
  }

  indexedDatabaseName = db.databaseName;
  forumIndexesPromise = Promise.all([
    db.collection("forumPosts").createIndex({ authorId: 1 }, { name: "forum_posts_author" }),
    db.collection("forumPosts").createIndex({ createdAt: -1 }, { name: "forum_posts_created_at_desc" }),
    db.collection("forumPosts").createIndex({ category: 1, createdAt: -1 }, { name: "forum_posts_category_created_at_desc" }),
    db.collection("forumComments").createIndex({ postId: 1, createdAt: 1 }, { name: "forum_comments_post_created_at" }),
    db.collection("forumComments").createIndex({ authorId: 1 }, { name: "forum_comments_author" }),
    db.collection("forumMessages").createIndex({ senderId: 1, recipientId: 1, createdAt: 1 }, { name: "forum_messages_sender_recipient_created_at" }),
    db.collection("forumMessages").createIndex({ recipientId: 1, read: 1, createdAt: -1 }, { name: "forum_messages_recipient_read_created_at_desc" })
  ]).catch((error) => {
    forumIndexesPromise = null;
    throw error;
  });

  return forumIndexesPromise;
}

async function getDb() {
  const client = await getMongoClient();
  const db = getDatabase(client);
  await ensureForumIndexes(db);
  return db;
}

function cleanText(value, field, maxLength) {
  const text = String(value || "").trim().replace(/\r\n/g, "\n");
  if (!text) {
    throw new Error(`${field} is required`);
  }
  return text.slice(0, maxLength);
}

function normalizeCategory(value) {
  const text = String(value || "general")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return text || "general";
}

function toObjectId(value, label) {
  if (!ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return new ObjectId(value);
}

function serializeDate(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value || null;
}

function serializePost(post, commentCount = 0) {
  if (!post) return null;

  return {
    ...post,
    _id: post._id.toString(),
    createdAt: serializeDate(post.createdAt),
    updatedAt: serializeDate(post.updatedAt),
    commentCount
  };
}

function serializeComment(comment) {
  if (!comment) return null;

  return {
    ...comment,
    _id: comment._id.toString(),
    createdAt: serializeDate(comment.createdAt),
    updatedAt: serializeDate(comment.updatedAt)
  };
}

function serializeMessage(message) {
  if (!message) return null;

  return {
    ...message,
    _id: message._id.toString(),
    createdAt: serializeDate(message.createdAt)
  };
}

function unwrapDocument(result) {
  if (!result) return null;
  if (Object.prototype.hasOwnProperty.call(result, "value")) {
    return result.value;
  }
  return result;
}

async function countCommentsByPostIds(db, postIds) {
  if (!postIds.length) {
    return new Map();
  }

  const counts = await db
    .collection("forumComments")
    .aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } }
    ])
    .toArray();

  return new Map(counts.map((item) => [item._id, item.count]));
}

async function getUserNameById(db, userId) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const user = await db.collection("users").findOne(
    { _id: new ObjectId(userId) },
    { projection: { name: 1 } }
  );

  return user?.name || null;
}

async function createPost(userId, userName, title, content, category = "general") {
  const db = await getDb();

  const post = {
    _id: new ObjectId(),
    authorId: String(userId),
    authorName: cleanText(userName, "Author name", 80),
    title: cleanText(title, "Title", 140),
    content: cleanText(content, "Content", 4000),
    category: normalizeCategory(category),
    createdAt: new Date(),
    updatedAt: new Date(),
    viewCount: 0
  };

  await db.collection("forumPosts").insertOne(post);
  return serializePost(post, 0);
}

async function getPosts(category = null, limit = 20, skip = 0) {
  const db = await getDb();
  const query = category ? { category: normalizeCategory(category) } : {};
  const posts = await db
    .collection("forumPosts")
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const postIds = posts.map((post) => post._id.toString());
  const counts = await countCommentsByPostIds(db, postIds);

  return posts.map((post) => serializePost(post, counts.get(post._id.toString()) || 0));
}

async function getPostById(postId) {
  const db = await getDb();
  const objectId = toObjectId(postId, "post id");
  const result = await db.collection("forumPosts").findOneAndUpdate(
    { _id: objectId },
    { $inc: { viewCount: 1 } },
    { returnDocument: "after" }
  );

  const post = unwrapDocument(result);
  if (!post) {
    return null;
  }

  const commentCount = await db.collection("forumComments").countDocuments({ postId: postId.toString() });
  return serializePost(post, commentCount);
}

async function updatePost(postId, userId, updates) {
  const db = await getDb();
  const objectId = toObjectId(postId, "post id");
  const post = await db.collection("forumPosts").findOne({ _id: objectId });

  if (!post) throw new Error("Post not found");
  if (post.authorId !== String(userId)) throw new Error("Unauthorized");

  const nextValues = {};

  if (Object.prototype.hasOwnProperty.call(updates, "title")) {
    nextValues.title = cleanText(updates.title, "Title", 140);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "content")) {
    nextValues.content = cleanText(updates.content, "Content", 4000);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "category")) {
    nextValues.category = normalizeCategory(updates.category);
  }

  if (!Object.keys(nextValues).length) {
    throw new Error("No valid post updates provided");
  }

  nextValues.updatedAt = new Date();

  const result = await db.collection("forumPosts").findOneAndUpdate(
    { _id: objectId },
    { $set: nextValues },
    { returnDocument: "after" }
  );

  const commentCount = await db.collection("forumComments").countDocuments({ postId: postId.toString() });
  return serializePost(unwrapDocument(result), commentCount);
}

async function deletePost(postId, userId) {
  const db = await getDb();
  const objectId = toObjectId(postId, "post id");
  const post = await db.collection("forumPosts").findOne({ _id: objectId });

  if (!post) throw new Error("Post not found");
  if (post.authorId !== String(userId)) throw new Error("Unauthorized");

  await db.collection("forumPosts").deleteOne({ _id: objectId });
  await db.collection("forumComments").deleteMany({ postId: postId.toString() });

  return { success: true };
}

async function createComment(postId, userId, userName, content) {
  const db = await getDb();
  const objectId = toObjectId(postId, "post id");
  const post = await db.collection("forumPosts").findOne({ _id: objectId });

  if (!post) throw new Error("Post not found");

  const comment = {
    _id: new ObjectId(),
    postId: postId.toString(),
    authorId: String(userId),
    authorName: cleanText(userName, "Author name", 80),
    content: cleanText(content, "Comment", 2000),
    createdAt: new Date(),
    updatedAt: null
  };

  await db.collection("forumComments").insertOne(comment);
  return serializeComment(comment);
}

async function getComments(postId, limit = 50, skip = 0) {
  const db = await getDb();
  toObjectId(postId, "post id");

  const comments = await db
    .collection("forumComments")
    .find({ postId: postId.toString() })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return comments.map((comment) => serializeComment(comment));
}

async function updateComment(commentId, userId, content) {
  const db = await getDb();
  const objectId = toObjectId(commentId, "comment id");
  const comment = await db.collection("forumComments").findOne({ _id: objectId });

  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== String(userId)) throw new Error("Unauthorized");

  const result = await db.collection("forumComments").findOneAndUpdate(
    { _id: objectId },
    {
      $set: {
        content: cleanText(content, "Comment", 2000),
        updatedAt: new Date()
      }
    },
    { returnDocument: "after" }
  );

  return serializeComment(unwrapDocument(result));
}

async function deleteComment(commentId, userId) {
  const db = await getDb();
  const objectId = toObjectId(commentId, "comment id");
  const comment = await db.collection("forumComments").findOne({ _id: objectId });

  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== String(userId)) throw new Error("Unauthorized");

  await db.collection("forumComments").deleteOne({ _id: objectId });
  return { success: true };
}

async function sendMessage(senderId, senderName, recipientId, recipientName, content) {
  const db = await getDb();

  if (!recipientId) {
    throw new Error("Recipient is required");
  }

  if (String(senderId) === String(recipientId)) {
    throw new Error("You cannot message yourself");
  }

  const resolvedRecipientName =
    String(recipientName || "").trim().slice(0, 80) ||
    (await getUserNameById(db, recipientId)) ||
    "Member";

  const message = {
    _id: new ObjectId(),
    senderId: String(senderId),
    senderName: cleanText(senderName, "Sender name", 80),
    recipientId: String(recipientId),
    recipientName: resolvedRecipientName,
    content: cleanText(content, "Message", 2000),
    createdAt: new Date(),
    read: false
  };

  await db.collection("forumMessages").insertOne(message);
  return serializeMessage(message);
}

async function getMessages(userId, otherUserId) {
  const db = await getDb();
  const messages = await db
    .collection("forumMessages")
    .find({
      $or: [
        { senderId: String(userId), recipientId: String(otherUserId) },
        { senderId: String(otherUserId), recipientId: String(userId) }
      ]
    })
    .sort({ createdAt: 1 })
    .toArray();

  return messages.map((message) => serializeMessage(message));
}

async function getConversations(userId) {
  const db = await getDb();
  const messages = await db
    .collection("forumMessages")
    .find({
      $or: [{ senderId: String(userId) }, { recipientId: String(userId) }]
    })
    .sort({ createdAt: -1 })
    .toArray();

  const conversations = new Map();

  for (const message of messages) {
    const otherId = message.senderId === String(userId) ? message.recipientId : message.senderId;
    const otherName =
      message.senderId === String(userId)
        ? message.recipientName || "Member"
        : message.senderName || "Member";

    if (!conversations.has(otherId)) {
      conversations.set(otherId, {
        userId: otherId,
        userName: otherName,
        lastMessage: message.content,
        lastMessageTime: serializeDate(message.createdAt),
        unread: 0
      });
    }

    if (message.recipientId === String(userId) && !message.read) {
      const current = conversations.get(otherId);
      current.unread += 1;
    }
  }

  return Array.from(conversations.values()).sort(
    (left, right) => new Date(right.lastMessageTime) - new Date(left.lastMessageTime)
  );
}

async function markMessagesAsRead(userId, senderId) {
  const db = await getDb();
  await db.collection("forumMessages").updateMany(
    {
      senderId: String(senderId),
      recipientId: String(userId),
      read: false
    },
    {
      $set: { read: true }
    }
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
