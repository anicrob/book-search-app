const { User, Book } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate("savedBooks");
      }
      throw AuthenticationError;
    },
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);

      return { token, user };
    },
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (
      parent,
      { bookData },
      context
    ) => {
      if (context.user) {
        try {
          const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            {
              $addToSet: {
                savedBooks: bookData
              },
            },
            { new: true, runValidators: true }
          );
          return {...updatedUser};
        } catch (err) {
          console.log(err);
        }
      }
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        try {
          const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: { bookId: bookId } } },
            { new: true }
          );
          if (!updatedUser) {
            return res.status(404).json({ message: "Couldn't find the user!" });
          }
          return { ...updatedUser };
        } catch (err) {
          console.log(err);
        }
      }
    },
  },
};

module.exports = resolvers;
