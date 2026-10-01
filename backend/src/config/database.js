import mysql from "mysql2/promise";

export function createDatabase(config) {
  const pool = mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    decimalNumbers: false
  });

  return {
    pool,
    async ping() {
      await pool.query("SELECT 1");
    },
    close() {
      return pool.end();
    }
  };
}
