require("../lib/load-env");
const {
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
} = require("../lib/forum-service");

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    const raw = req.body.trim();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("Invalid JSON payload.");
    }
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON payload.");
  }
}

function parseRequest(req) {
  const protocol = req.headers?.["x-forwarded-proto"] || "http";
  const host = req.headers?.host || "localhost";
  const parsedUrl = new URL(req.url, `${protocol}://${host}`);
  const pathname = parsedUrl.pathname.replace(/\/+$/, "");

  return {
    parsedUrl,
    parts: pathname.split("/").filter(Boolean)
  };
}

function getAuthUser(req) {
  const authHeader = req.headers?.authorization || "";
  const auth = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : req.cookies?.auth;

  if (!auth) throw new Error("Unauthorized");

  try {
    const decoded = JSON.parse(Buffer.from(auth, "base64").toString("utf-8"));
    if (!decoded?.id || !decoded?.name) {
      throw new Error("Invalid auth token");
    }
    return decoded;
  } catch {
    throw new Error("Invalid auth token");
  }
}

function getStatusCode(error) {
  if (error?.code === "CONFIG_ERROR") return 500;

  switch (error.message) {
    case "Unauthorized":
    case "Invalid auth token":
      return 401;
    case "Post not found":
    case "Comment not found":
    case "Endpoint not found":
      return 404;
    default:
      if (error.message?.startsWith("Invalid ")) {
        return 400;
      }
      return 400;
  }
}

async function handleForumRequest(req, res) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const { parsedUrl, parts } = parseRequest(req);

    // GET /api/forum/posts
    if (req.method === "GET" && parts[1] === "forum" && parts[2] === "posts" && !parts[3]) {
      const category = parsedUrl.searchParams.get("category");
      const posts = await getPosts(category);
      return sendJson(res, 200, { posts });
    }

    // POST /api/forum/posts
    if (req.method === "POST" && parts[1] === "forum" && parts[2] === "posts" && !parts[3]) {
      const user = getAuthUser(req);
      const body = await readJsonBody(req);
      const post = await createPost(user.id, user.name, body.title, body.content, body.category);
      return sendJson(res, 201, { post });
    }

    // GET /api/forum/posts/:id
    if (req.method === "GET" && parts[1] === "forum" && parts[2] === "posts" && parts[3]) {
      const post = await getPostById(parts[3]);
      if (!post) return sendJson(res, 404, { error: "Post not found" });
      return sendJson(res, 200, { post });
    }

    // PUT /api/forum/posts/:id
    if (req.method === "PUT" && parts[1] === "forum" && parts[2] === "posts" && parts[3]) {
      const user = getAuthUser(req);
      const body = await readJsonBody(req);
      const post = await updatePost(parts[3], user.id, body);
      return sendJson(res, 200, { post });
    }

    // DELETE /api/forum/posts/:id
    if (req.method === "DELETE" && parts[1] === "forum" && parts[2] === "posts" && parts[3]) {
      const user = getAuthUser(req);
      const result = await deletePost(parts[3], user.id);
      return sendJson(res, 200, result);
    }

    // POST /api/forum/posts/:id/comments
    if (req.method === "POST" && parts[1] === "forum" && parts[2] === "posts" && parts[3] && parts[4] === "comments") {
      const user = getAuthUser(req);
      const body = await readJsonBody(req);
      const comment = await createComment(parts[3], user.id, user.name, body.content);
      return sendJson(res, 201, { comment });
    }

    // GET /api/forum/posts/:id/comments
    if (req.method === "GET" && parts[1] === "forum" && parts[2] === "posts" && parts[3] && parts[4] === "comments") {
      const comments = await getComments(parts[3]);
      return sendJson(res, 200, { comments });
    }

    // PUT /api/forum/comments/:id
    if (req.method === "PUT" && parts[1] === "forum" && parts[2] === "comments" && parts[3]) {
      const user = getAuthUser(req);
      const body = await readJsonBody(req);
      const comment = await updateComment(parts[3], user.id, body.content);
      return sendJson(res, 200, { comment });
    }

    // DELETE /api/forum/comments/:id
    if (req.method === "DELETE" && parts[1] === "forum" && parts[2] === "comments" && parts[3]) {
      const user = getAuthUser(req);
      const result = await deleteComment(parts[3], user.id);
      return sendJson(res, 200, result);
    }

    // POST /api/forum/messages
    if (req.method === "POST" && parts[1] === "forum" && parts[2] === "messages") {
      const user = getAuthUser(req);
      const body = await readJsonBody(req);
      const message = await sendMessage(
        user.id,
        user.name,
        body.recipientId,
        body.recipientName,
        body.content
      );
      return sendJson(res, 201, { message });
    }

    // GET /api/forum/messages/:id
    if (req.method === "GET" && parts[1] === "forum" && parts[2] === "messages" && parts[3]) {
      const user = getAuthUser(req);
      const messages = await getMessages(user.id, parts[3]);
      await markMessagesAsRead(user.id, parts[3]);
      return sendJson(res, 200, { messages });
    }

    // GET /api/forum/conversations
    if (req.method === "GET" && parts[1] === "forum" && parts[2] === "conversations") {
      const user = getAuthUser(req);
      const conversations = await getConversations(user.id);
      return sendJson(res, 200, { conversations });
    }

    sendJson(res, 404, { error: "Endpoint not found" });
  } catch (error) {
    sendJson(res, getStatusCode(error), { error: error.message });
  }
}

module.exports = { handleForumRequest };
