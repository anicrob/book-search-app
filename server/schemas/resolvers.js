const { User, Book } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        //find user with an id of the user._id in the context
        const user = await User.findOne({ _id: context.user._id });
        return user;
      };
      throw AuthenticationError;
    },
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      //find user that matches the email provided by user
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }
      //if the user is found, compare the pw provided by user to the pw on the user's account
      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }
      //if email & pw is correct, sign the token, with parameter of the user profile
      const token = signToken(user);
      //return the token and user (destructured Auth type)
      return { token, user };
    },
    addUser: async (parent, { username, email, password }) => {
      //create a user with the user provided un, email, and pw values in the form
      const user = await User.create({ username, email, password });
      //sign the token
      const token = signToken(user);
      //return the token and user (destructured Auth type)
      return { token, user };
    },
    saveBook: async (
      parent,
      { bookData },
      context
    ) => {
      if (context.user) {
        try {
          //find the user by _id that matches the user._id of the context
          const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            {
              //add the bookData to the savedBooks property (array on user)
              $addToSet: {
                savedBooks: bookData
              },
            },
            //return new/updated document
            { new: true, runValidators: true }
          );
          //return the updatedUser
          return updatedUser;
        } catch (err) {
          console.log(err);
        }
      }
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        try {
          //find user by _id that matches the user._id of the context
          const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
            //pull/remove the book with the bookId of the deleted bookId from the savedBooks property on the user
            { $pull: { savedBooks: { bookId: bookId } } },
            { new: true }
          );
          if (!updatedUser) {
            throw AuthenticationError;
          }
          //return the updatedUser
          return updatedUser;
        } catch (err) {
          console.log(err);
        }
      }
    },
  },
};

module.exports = resolvers;
