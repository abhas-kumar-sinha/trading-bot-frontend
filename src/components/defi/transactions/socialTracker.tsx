import { useState, useEffect } from "react";
import axios from "axios";
import TweetCard from "./tweetCard";

export interface Tweet {
  tweetId: string;
  eventType: string;
  user: {
    username: string;
    handle: string;
    profilePic: string;
  };
  referenceUser: {
    username: string;
    bio: string;
    handle: string;
    profilePic: string;
    follower: number;
    following: number;
  };
  contentNew: string;
  contentOld: string;
  eventTime: number;
  fileUrls: string;
  videoUrls: string;
  referencedFiles: string;
  referencedVideos: string;
  referenceTime: number;
  tweetTextTranslation:string;
  referencedTextTranslation: string;
}

const SocialTracker = () => {

  const [tweets, setTweets] = useState<Tweet[] | null>(null);

  const fetchTweets = async () => {
    const tweets = await axios.get(`${import.meta.env.VITE_BOT_BASE_URL}/api/social-tweets`)
    setTweets(tweets.data.data);
  }

  useEffect(() => {
    fetchTweets()

    const interval = setInterval(fetchTweets, 120000) // 2 minutes

    return () => clearInterval(interval);
  }, [])

  return (
    <div className="border border-border rounded-xl flex flex-col flex-shrink-0 w-[30.5%] bg-sidebar p-3 text-sidebar-foreground">
        <p className="text-3xl bg-gradient-to-br from-popover-foreground to-sidebar bg-clip-text text-transparent whitespace-nowrap">
          Social Tracker
        </p>
        <div className="h-full w-full mt-3 px-2 rounded-xl overflow-y-scroll scrollbar-hide">
          {tweets ? 
            tweets.map((tweet: Tweet) =>
              <TweetCard key={tweet.tweetId} tweet={tweet} />
            )
            :
            <>
              <p className="w-80">Loading...</p>
            </>
          }
        </div>
    </div>
  )
}
export default SocialTracker