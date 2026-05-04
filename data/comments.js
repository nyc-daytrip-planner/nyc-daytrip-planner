import { comments, locations, users } from '../config/mongoCollections.js';
import { checkId, checkString } from '../helpers.js';
import { ObjectId } from 'mongodb';

export async function createComment({ locationId, userId, text }) {
  if (locationId === undefined) throw 'Must have a locationId';
  if (userId === undefined) throw 'Must have a userId';
  if (text === undefined) throw 'Must have text';

  locationId = checkId(locationId);
  userId = checkId(userId);
  text = checkString(text);

  const locationsCol = await locations();
  const location = await locationsCol.findOne({ _id: new ObjectId(locationId) });
  if (location === null) throw 'No location found with that id';

  const commentsCol = await comments();
  const newComment = {
    locationId: new ObjectId(locationId),
    userId: new ObjectId(userId),
    text,
    createdAt: new Date()
  };
  const result = await commentsCol.insertOne(newComment);
  if (!result.acknowledged || !result.insertedId) throw 'Could not create comment';

  return await getCommentById(result.insertedId.toString());
}

export async function getCommentById(commentId) {
  if (commentId === undefined) throw 'Must have a commentId';
  commentId = checkId(commentId);

  const commentsCol = await comments();
  const c = await commentsCol.findOne({ _id: new ObjectId(commentId) });
  if (c === null) throw 'No comment found with that id';

  c._id = c._id.toString();
  c.locationId = c.locationId.toString();
  c.userId = c.userId.toString();
  return c;
}

export async function getCommentsForLocation(locationId) {
  if (locationId === undefined) throw 'Must have a locationId';
  locationId = checkId(locationId);

  const commentsCol = await comments();
  const usersCol = await users();

  const list = await commentsCol
    .find({ locationId: new ObjectId(locationId) })
    .sort({ createdAt: -1 })
    .toArray();

  if (list.length === 0) return [];

  const authorIds = [...new Set(list.map((c) => c.userId.toString()))].map(
    (id) => new ObjectId(id)
  );
  const authors = await usersCol
    .find({ _id: { $in: authorIds } })
    .project({ firstName: 1 })
    .toArray();
  const nameById = new Map(authors.map((u) => [u._id.toString(), u.firstName]));

  return list.map((c) => ({
    _id: c._id.toString(),
    locationId: c.locationId.toString(),
    userId: c.userId.toString(),
    text: c.text,
    createdAt: c.createdAt,
    authorFirstName: nameById.get(c.userId.toString()) || 'Unknown'
  }));
}

export async function deleteComment(commentId, requester) {
  if (commentId === undefined) throw 'Must have a commentId';
  if (!requester || requester._id === undefined) throw 'Must have a requester';

  commentId = checkId(commentId);
  const requesterId = checkId(requester._id);
  const requesterRole = requester.role === 'admin' ? 'admin' : 'user';

  const commentsCol = await comments();
  const existing = await commentsCol.findOne({ _id: new ObjectId(commentId) });
  if (existing === null) throw 'No comment found with that id';

  const isAuthor = existing.userId.toString() === requesterId;
  if (!isAuthor && requesterRole !== 'admin') {
    throw 'You can only delete your own comment';
  }

  const result = await commentsCol.deleteOne({ _id: new ObjectId(commentId) });
  if (result.deletedCount !== 1) throw 'Could not delete comment';

  return { deleted: true, commentId };
}

// Used by admin moderation table — joins location name + author email so the
// admin can identify what they're deleting at a glance.
export async function getAllCommentsForAdmin() {
  const commentsCol = await comments();
  const usersCol = await users();
  const locsCol = await locations();

  const list = await commentsCol.find({}).sort({ createdAt: -1 }).toArray();
  if (list.length === 0) return [];

  const userIds = [...new Set(list.map((c) => c.userId.toString()))].map((id) => new ObjectId(id));
  const locIds = [...new Set(list.map((c) => c.locationId.toString()))].map((id) => new ObjectId(id));

  const usersList = await usersCol
    .find({ _id: { $in: userIds } })
    .project({ email: 1, firstName: 1 })
    .toArray();
  const locsList = await locsCol
    .find({ _id: { $in: locIds } })
    .project({ name: 1 })
    .toArray();
  const usersMap = new Map(usersList.map((u) => [u._id.toString(), u]));
  const locsMap = new Map(locsList.map((l) => [l._id.toString(), l]));

  return list.map((c) => ({
    _id: c._id.toString(),
    locationId: c.locationId.toString(),
    locationName: locsMap.get(c.locationId.toString())?.name || '(deleted location)',
    userId: c.userId.toString(),
    authorEmail: usersMap.get(c.userId.toString())?.email || '(deleted user)',
    text: c.text,
    createdAt: c.createdAt
  }));
}
