use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database connection failed: {0}")]
    ConnectionError(String),
    #[error("Query execution failed: {0}")]
    QueryError(String),
    #[error("Transaction failed: {0}")]
    TransactionError(String),
}
