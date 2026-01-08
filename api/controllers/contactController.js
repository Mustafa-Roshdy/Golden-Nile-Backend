const Contact = require("../models/contactModel.js");

const USER_FIELDS = "firstName lastName email photo role";

const populateContact = (query) =>
  query
    .populate("user", USER_FIELDS)
    .populate("contactUser", USER_FIELDS);

const isParticipant = (contact, userId) => {
  if (!contact || !userId) return false;
  const normalizedId = userId.toString();
  return (
    contact.user?.toString() === normalizedId ||
    contact.contactUser?.toString() === normalizedId
  );
};

const createAuthError = () => {
  const error = new Error("Not authorized");
  error.statusCode = 403;
  return error;
};

// Get all contacts for a user (owner or guest)
async function getContacts(userId) {
  const contacts = await populateContact(
    Contact.find({
      $or: [{ user: userId }, { contactUser: userId }],
    })
  ).sort({ updatedAt: -1, createdAt: -1 });

  // Flip roles for contacts where the user is the contactUser
  return contacts.map(contact => {
    const contactObj = contact.toObject();
    const isMainUser = contactObj.user._id.toString() === userId;

    // Normalize unreadCount based on requesting user
    contactObj.unreadCount = isMainUser ? contactObj.userUnreadCount : contactObj.contactUserUnreadCount;

    if (!isMainUser) {
      contactObj.messages = contactObj.messages.map(msg => ({
        ...msg,
        role: msg.role === "me" ? "other" : "me"
      }));
    }
    return contactObj;
  });
}

// Create a new contact (conversation)
async function createContact(userId, contactUserId) {
  const count = await Contact.countDocuments();
  if (count >= 20) {
    throw new Error("Cannot create more than 20 contacts");
  }
  // Avoid creating duplicates regardless of who started the chat first
  const existing = await populateContact(
    Contact.findOne({
      $or: [
        { user: userId, contactUser: contactUserId },
        { user: contactUserId, contactUser: userId },
      ],
    })
  );
  if (existing) return existing;

  const contact = await Contact.create({
    user: userId,
    contactUser: contactUserId,
  });

  return await getContact(contact._id, userId);
}

// Get single contact
async function getContact(contactId, userId) {
  const contact = await populateContact(Contact.findById(contactId));
  if (!contact) return null;

  // Normalize unreadCount based on requesting user
  const contactObj = contact.toObject();
  const isMainUser = contactObj.user._id.toString() === userId;

  contactObj.unreadCount = isMainUser ? contactObj.userUnreadCount : contactObj.contactUserUnreadCount;

  if (!isMainUser) {
    contactObj.messages = contactObj.messages.map(msg => ({
      ...msg,
      role: msg.role === "me" ? "other" : "me"
    }));
  }

  return contactObj;
}

// Reset unread count for a user in a specific contact
async function resetUnreadCount(contactId, userId) {
  const contact = await Contact.findById(contactId);
  if (!contact) throw new Error("Contact not found");

  if (contact.user.toString() === userId.toString()) {
    contact.userUnreadCount = 0;
  } else if (contact.contactUser.toString() === userId.toString()) {
    contact.contactUserUnreadCount = 0;
  }

  await contact.save();
  return await getContact(contactId, userId);
}

// Add message to contact
async function addMessage(contactId, senderId, message) {
  const contact = await Contact.findById(contactId);
  if (!contact) throw new Error("Contact not found");
  if (!isParticipant(contact, senderId)) throw createAuthError();

  const isMainUser = contact.user.toString() === senderId.toString();
  const role = isMainUser ? "me" : "other";

  contact.messages.push({ role, message });

  // Increment unread count for the OTHER user
  if (isMainUser) {
    contact.contactUserUnreadCount += 1;
  } else {
    contact.userUnreadCount += 1;
  }

  contact.markModified("messages");
  contact.updatedAt = new Date();
  await contact.save();

  return await getContact(contactId, senderId);
}

// Update message
async function updateMessage(contactId, messageId, senderId, newMessage) {
  const contact = await Contact.findById(contactId);
  if (!contact) throw new Error("Contact not found");
  if (!isParticipant(contact, senderId)) throw createAuthError();

  const msg = contact.messages.id(messageId);
  if (!msg) throw new Error("Message not found");

  msg.message = newMessage;
  msg.updatedAt = new Date();
  contact.markModified("messages");
  contact.updatedAt = new Date();
  await contact.save();

  return await getContact(contactId, senderId);
}

// Delete message
async function deleteMessage(contactId, messageId, senderId) {
  const contact = await Contact.findById(contactId);
  if (!contact) throw new Error("Contact not found");
  if (!isParticipant(contact, senderId)) throw createAuthError();

  contact.messages.pull(messageId);
  contact.markModified("messages");
  contact.updatedAt = new Date();
  await contact.save();

  return await getContact(contactId, senderId);
}

// Delete contact
async function deleteContact(contactId, requesterId) {
  const contact = await Contact.findById(contactId);
  if (!contact) return null;
  if (!isParticipant(contact, requesterId)) throw createAuthError();

  return await Contact.findByIdAndDelete(contactId);
}

module.exports = {
  getContacts,
  createContact,
  getContact,
  addMessage,
  updateMessage,
  deleteMessage,
  deleteContact,
  resetUnreadCount,
};