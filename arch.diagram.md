graph TD
    A[User] -->|Logs in, manages data| F[Frontend<br>Crypto Wallet Login]
    B[(AI Chatbot<br>Powered by OpenAI + ELIZA)] -->|Detects embeddings| C{Call API}
    C -->|Yes| D[API]
    C -->|No Permission| B
    D -->|Checks permissions| E{EthStorage}
    E -->|Returns data if authorized| D
    D -->|Lit Decrypts and provides data| B
    F[Frontend<br>Crypto Wallet Login] -->|Lit Encrypt and store data| E
