# AI Tutor Chat

A modern, interactive AI tutoring platform built with Next.js, TypeScript, and PostgreSQL. This application provides personalized learning experiences for students grades 6-12 across different education boards.

## Features

- 🤖 **AI-Powered Tutoring**: Interactive chat interface with intelligent responses
- 👤 **User Profiles**: Personalized learning based on grade level and education board
- 💬 **Real-time Messaging**: Smooth chat experience with typing indicators
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔄 **Offline Support**: Queue messages when offline and send when reconnected
- 🎯 **Session Management**: Track learning sessions and concepts covered
- 🗃️ **PostgreSQL Database**: Robust data storage and retrieval
- 🔒 **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Icons**: Lucide React
- **Deployment**: Vercel-ready configuration

## Prerequisites

- Node.js 18.17.0 or later
- PostgreSQL database
- npm or yarn package manager

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repository-url>
cd ai-tutor-chat
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database
2. Run the schema creation script:

```bash
psql -U your_username -d your_database_name -f database/schema.sql
```

### 3. Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Update the environment variables:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/ai_tutor_db
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key-here  # Optional for AI integration
NODE_ENV=development
```

### 4. Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Users
- `POST /api/user` - Create new user
- `GET /api/user?user_id={id}` - Get user by ID
- `GET /api/user?username={username}` - Get user by username

### Sessions
- `POST /api/session` - Create new session
- `GET /api/session?user_id={id}` - Get user sessions

### Chat
- `POST /api/chat` - Send message and get AI response

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Authentication secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `OPENAI_API_KEY` | OpenAI API key (for enhanced AI) | No |
| `NODE_ENV` | Environment (development/production) | Yes |

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Built with ❤️ using Next.js and TypeScript