## Resources

- users
- profiles
  - [users.id]
    - name
- arrangements
  - [users.id]
    - front
      - papers.id[]
    - archived
      - papers.id[]
- papers
  - uid
  - tags
  - blocks
- ownerships
  - [papers.id]
    - [users.id]: none, reader, editor, admin
- accesses
  - [papers.id]
    - target: private, limited, public
    - role: none, reader, editor

- role
  - none: 何もできない
  - reader: paperの読取可能
  - editor: paperの読取、編集可能
  - admin: paperの読取、編集可能、accessesとownershipsの編集可能
- target
  - private: ownershipがある人のみ
  - limited: リンクを知る人のみ可能
  - public: 誰もが可能

- [Firebase 公式動画から『Firestore の DB 設計の基礎』を学ぶ - Qiita](https://qiita.com/KosukeSaigusa/items/860b5a2a6a02331d07cb)
- [Firestoreセキュリティルールの基礎と実践 - セキュアな Firebase活用に向けたアプローチを理解する - Flatt Security Blog](https://blog.flatt.tech/entry/firestore_security_rules)
- [セキュリティ ルール言語  |  Firebase セキュリティ ルール](https://firebase.google.com/docs/rules/rules-language?hl=ja)
