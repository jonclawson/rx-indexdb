
import './style.css';

import { IDBService } from './IDBService.js';

// Setup UI Log
const appDiv = document.getElementById('app');
appDiv.innerHTML = `
<h1>RxIndexDB</h1>
<pre class="log"></pre>
`;
const log = (s) => (document.querySelector('.log').innerHTML += '\n' + s);

// Initiate Service
const schema = {
  stores: [
    {
      name: 'users',
      keyPath: 'email',
      indexes: [{ key: 'name', name: 'name', unique: false }],
    },
  ],
};
const users = [
  { name: 'Bill', age: 35, email: 'bill@company.com' },
  { name: 'Donna', age: 32, email: 'donna@home.org' },
];

const db = new IDBService('user_test', schema, users, 1);

// Add user
const user = [{ name: 'Sammy', email: 'sam@compny.com' }];

db.add(user, 'users').subscribe((r) => log(JSON.stringify(r)));

db.get('sam@compny.com', 'users').subscribe((user) => {
  log('user found?' + JSON.stringify(user, '', 1));
});

// Update User
db.put(
  { name: 'Billy', age: 37, email: 'bill@company.com' },
  'users'
).subscribe((r) => log(r));

// Get All Users
db.getAll('users').subscribe((users) => {
  log('users ' + JSON.stringify(users, '', 2));
});

// Delete User
db.delete('sam@compny.com', 'users').subscribe((r) => log(r));
