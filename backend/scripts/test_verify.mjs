import http from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createStorefrontApp } from '../src/storefront/app.js';
import { createServiceApp } from '../src/service/app.js';
console.log('Imports verified!');