const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');

const public_users = express.Router();

// Register a new user.
public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() ||
      typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (users.some(user => user.username === username) || isValid(username)) {
    return res.status(409).json({ message: 'User already exists' });
  }
  users.push({ username, password });
  return res.status(201).json({ message: 'User successfully registered. Now you can login' });
});

// Public book catalogue routes.
public_users.get('/', (req, res) => res.json(books));

public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.json(book) : res.status(404).json({ message: 'Book not found' });
});

public_users.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  const matches = Object.values(books).filter(
    book => book.author.toLowerCase() === author
  );
  return res.json(matches);
});

public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  const matches = Object.values(books).filter(
    book => book.title.toLowerCase() === title
  );
  return res.json(matches);
});

public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.json(book.reviews || {}) : res.status(404).json({ message: 'Book not found' });
});

// Tasks 10–13: use async/await and Axios to retrieve books through HTTP.
// Configure BOOK_API_BASE_URL if the application is not on localhost:5000.
const apiBaseURL = process.env.BOOK_API_BASE_URL || 'http://localhost:5000';

async function fetchBookData(path) {
  const response = await axios.get(`${apiBaseURL}${path}`, { timeout: 5000 });
  return response.data;
}

const getAllBooks = () => fetchBookData('/');
const getBookByISBN = isbn => fetchBookData(`/isbn/${encodeURIComponent(isbn)}`);
const getBooksByAuthor = author => fetchBookData(`/author/${encodeURIComponent(author)}`);
const getBooksByTitle = title => fetchBookData(`/title/${encodeURIComponent(title)}`);

function handleAxiosError(error, res) {
  const status = error.response?.status || 502;
  return res.status(status).json({ message: 'Unable to retrieve books', error: error.message });
}

public_users.get('/async/books', async (req, res) => {
  try { return res.json(await getAllBooks()); }
  catch (error) { return handleAxiosError(error, res); }
});

public_users.get('/async/isbn/:isbn', async (req, res) => {
  try { return res.json(await getBookByISBN(req.params.isbn)); }
  catch (error) { return handleAxiosError(error, res); }
});

public_users.get('/async/author/:author', async (req, res) => {
  try { return res.json(await getBooksByAuthor(req.params.author)); }
  catch (error) { return handleAxiosError(error, res); }
});

public_users.get('/async/title/:title', async (req, res) => {
  try { return res.json(await getBooksByTitle(req.params.title)); }
  catch (error) { return handleAxiosError(error, res); }
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
