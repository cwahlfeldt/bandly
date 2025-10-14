# Bandly

Bandly is a music band management app that allows users to create bands, invite other users to join the band, and manage the band's schedule, events, and audio tracks. The app also includes a chat feature that allows users to communicate with each other and share audio tracks, events, setlists, and simple text messages. Think slack but cusomized for bands and musicians.

## Simple user flow:

1. User signs up
2. User signs in
3. User creates a new band
4. User invites another User2 to join the band
5. User2 joins the band
6. User starts chat with the band which includes User2
7. User books show for band
8. User2 checks the band's calendar for upcoming events
9. User checks dashboard for upcoming events
10. User posts new audio track
11. User2 listens to the audio track
12. User2 shares the audio track in the chat with a message
13. User clicks on the audio track in the chat to listen to it
14. User starts new band

## Types of data:

- Users

  - email
  - password
  - name
  - profile picture

- Bands

  - name
  - description
  - members
  - photo

    - Events

      - name
      - description
      - date
      - time
      - location
      - type (show, practice, recording...)

    - Audio tracks

      - name
      - description
      - upload

    - Set Lists

      - name
      - description
      - songs
        - name

## Views:

- Sign up
- Sign in
- Dashboard
- Calendar
- Chat
- Audio tracks

## Tech stack:

- React Native
- Expo
- Supabase for auth, db, realtime, and storage
- React Native Reusables for UI components
