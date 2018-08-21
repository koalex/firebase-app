<h1 align="center">Carry Demo</h1>

Before startup you will need to install docker for runing MySQL in container or you can start MySQL locally with initial script in "**./init_scripts/init_db.sql**"

1\) Install dependencies:
  ```bash
  npm install
  ```

2\) Run MySQL from docker:
  ```bash
  docker-compose up
  ```
  or
```bash
npm run db:start
```

3\) Start node.js server
```bash
npm start
```
  or dev-server
```bash
npm run dev
```

4\) Go to [localhost:3000](http://localhost:3000)
