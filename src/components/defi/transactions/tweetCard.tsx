import he from "he";
import { timeAgo } from "@/lib/utils";
import TweetVideo from "./tweetVideo";
import type { Tweet } from "./socialTracker";

const TweetCard = ({ tweet }: { tweet: Tweet }) => {
  const getTweetType = (type: string) => {
    switch (type) {
        case "newTweet":
            return "New Post";
        case "reply":
            return "New Reply";
        case "retweet":
            return "Repost";
        case "quote":
            return "New Quote";
        case "follow":
            return "New Follow";
        case "bio":
            return "Bio Change";
        default:
            return "Unknown";
    }
  }

  const getImageLayout = (fileUrls: string[]) => {
    if (!fileUrls || fileUrls.length === 0) return null;
    
    if (fileUrls.length === 1) {
        return (
            <div className="text-sm flex flex-col gap-y-2">
                <img
                  src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[0])}`}
                  alt={fileUrls[0]}
                  className="h-45 w-full object-cover rounded-xl"
                />
            </div>
          );
    }

    if (fileUrls.length === 2) {
        return (
            <div className="text-sm flex flex-col gap-y-2">
                <div className="h-45 w-full flex gap-x-0.5">
                    <img
                    key={fileUrls[0]}
                    src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[0])}`}
                    alt={fileUrls[0]}
                    className="h-45 w-[49.5%] object-cover rounded-l-xl"
                    />
                    <img
                    key={fileUrls[1]}
                    src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[1])}`}
                    alt={fileUrls[1]}
                    className="h-45 w-[49.5%] object-cover rounded-r-xl"
                    />
              </div>
            </div>
          );
    }

    if (fileUrls.length === 3) {
        return (
            <div className="text-sm flex flex-col gap-y-2">
                <div className="h-45 w-full flex gap-x-0.5">
                    <img
                    key={fileUrls[0]}
                    src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[0])}`}
                    alt={fileUrls[0]}
                    className="h-45 w-[49.5%] object-cover rounded-l-xl"
                    />
                    <div className="h-45 w-[49.5%] rounded-r-xl gap-y-0.5 flex flex-col">
                        <img
                        key={fileUrls[1]}
                        src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[1])}`}
                        alt={fileUrls[1]}
                        className="h-[49.5%] w-full object-cover rounded-tr-xl"
                        />
                        <img
                        key={fileUrls[2]}
                        src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[2])}`}
                        alt={fileUrls[2]}
                        className="h-[49.5%] w-full object-cover rounded-br-xl"
                        />
                    </div>
              </div>
            </div>
          );
    }

    if (fileUrls.length === 4) {
        return (
            <div className="text-sm flex flex-col gap-y-2">
                <div className="h-45 w-full flex gap-x-0.5">
                <div className="h-45 w-[49.5%] rounded-r-xl gap-y-0.5 flex flex-col">
                        <img
                        key={fileUrls[0]}
                        src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[0])}`}
                        alt={fileUrls[0]}
                        className="h-[49.5%] w-full object-cover rounded-tr-xl"
                        />
                        <img
                        key={fileUrls[1]}
                        src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[1])}`}
                        alt={fileUrls[1]}
                        className="h-[49.5%] w-full object-cover rounded-tr-xl"
                        />
                    </div>
                    <div className="h-45 w-[49.5%] rounded-r-xl gap-y-0.5 flex flex-col">
                    <img
                        key={fileUrls[2]}
                        src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[2])}`}
                        alt={fileUrls[2]}
                        className="h-[49.5%] w-full object-cover rounded-br-xl"
                        />
                        <img
                        key={fileUrls[3]}
                        src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(fileUrls[3])}`}
                        alt={fileUrls[3]}
                        className="h-[49.5%] w-full object-cover rounded-br-xl"
                        />
                    </div>
              </div>
            </div>
          );
    }
  };

  if (tweet.eventType === "follow") {
    return (
        <div className="py-3 border-b border-border w-full">
        <div className="bg-primary/30 text-primary w-fit py-1 px-3 text-sm rounded-lg">
          {tweet.user.username} {getTweetType(tweet.eventType)}
        </div>
        <div className="mt-4">
        <img src={
                  `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(tweet.referenceUser.profilePic)}`} 
                  alt={tweet.referenceUser.username} 
                  className="w-12 h-12 rounded-full" />
        </div>
        <p className="mt-2">{tweet.referenceUser.username}</p>
        <span className="text-xs text-muted-foreground mt-4">@{tweet.referenceUser.handle}</span>
        <p className="mt-4 dark:text-amber-50 text-sm">{tweet.referenceUser.bio}</p>
        <div className="flex gap-x-4 mt-4">
            <p className="dark:text-amber-50 text-sm">{tweet.referenceUser.following} <span className="text-muted-foreground">Following</span></p>
            <p className="dark:text-amber-50 text-sm">{tweet.referenceUser.follower} <span className="text-muted-foreground">Followers</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-3 border-b border-border w-full">
        <div className="bg-primary/30 text-primary w-fit py-1 px-3 text-sm rounded-lg">
            {tweet.user.username} {getTweetType(tweet.eventType)}
        </div>
        {tweet.eventType === "reply" && (
            <div className="mt-4 flex gap-x-2 w-full">
                <div className="flex flex-col gap-y-2 items-center">
                    <img src={
                            `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(tweet.referenceUser.profilePic)}`} 
                            alt={tweet.referenceUser.username} 
                            className="w-8 h-8 rounded-full" />
                    <div className="w-0.5 h-full bg-primary/50" />
                </div>
                <div className="flex flex-col w-[90%] text-wrap">
                    <div className="flex items-center gap-x-2">
                        <a href={`https://x.com/${tweet.referenceUser.handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline dark:text-amber-50 whitespace-nowrap truncate max-w-1/2">{tweet.referenceUser.username}</a>
                        <span className="text-xs text-muted-foreground">@{tweet.referenceUser.handle}</span>
                        <span className="text-xs text-muted-foreground">· {timeAgo(tweet.referenceTime)}</span>
                    </div>
                    <div className="mt-2 text-sm flex flex-col gap-y-4">
                        <p className="whitespace-pre-line dark:text-amber-50">{he.decode(tweet.contentOld)}</p>
                        {getImageLayout(tweet.referencedFiles ? JSON.parse(tweet.referencedFiles) : [])}
                        <TweetVideo videoUrls={tweet.referencedVideos} />
                        <p className="text-muted-foreground">{tweet.referencedTextTranslation}</p>
                    </div>
                </div>
            </div>
        )}
      <div className="mt-4 flex gap-x-2 w-full">
        {tweet.user.profilePic && <img src={
                `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(tweet.user.profilePic)}`} 
                alt={tweet.user.username} 
                className="w-8 h-8 rounded-full" />}
        <div className="flex flex-col w-[90%] text-wrap">
            <div className="flex items-center gap-x-2">
                <a href={`https://x.com/${tweet.user.handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline dark:text-amber-50 whitespace-nowrap truncate max-w-1/2">{tweet.user.username}</a>
                <span className="text-xs text-muted-foreground">@{tweet.user.handle}</span>
                <span className="text-xs text-muted-foreground">· {timeAgo(tweet.eventTime)}</span>
            </div>
            <div className="mt-2 text-sm flex flex-col gap-y-4">
                {tweet.contentNew && <p className="whitespace-pre-line dark:text-amber-50">{he.decode(tweet.contentNew)}</p>}
                {getImageLayout(tweet.fileUrls ? JSON.parse(tweet.fileUrls) : [])}
                <TweetVideo videoUrls={tweet.videoUrls} />
                {tweet.tweetTextTranslation && <p className="text-muted-foreground">{tweet.tweetTextTranslation}</p>}
                {tweet.eventType === "bio" && (
                    <div className="flex justify-between min-h-15 w-[110%] gap-x-2">
                        <div className="h-full bg-background w-[49.5%] p-1 rounded-lg">
                            <span className="text-xs text-muted-foreground">Old Bio</span>
                            <p className="break-words whitespace-normal dark:text-amber-50 mt-2 w-full">{he.decode(tweet.contentOld)}</p>
                        </div>
                        <div className="h-full bg-background w-[49.5%] p-1 rounded-lg">
                            <span className="text-xs text-muted-foreground">New Bio</span>
                            <p className="break-words whitespace-normal dark:text-amber-50 mt-2 w-full">{he.decode(tweet.contentNew)}</p>
                        </div>
                    </div>
                )}
                {(tweet.eventType === "retweet" || tweet.eventType === "quote") && (
                    <div className="bg-background rounded-lg p-2 mt-2">
                        <div className="flex items-center gap-x-2">
                            <img src={
                                `${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(tweet.referenceUser.profilePic)}`} 
                                alt={tweet.referenceUser.username} 
                                className="w-6 h-6 rounded-full" />
                            <a href={`https://x.com/${tweet.referenceUser.handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline dark:text-amber-50 whitespace-nowrap truncate max-w-1/2">{tweet.referenceUser.username}</a>
                            <span className="text-xs text-muted-foreground">@{tweet.referenceUser.handle}</span>
                            <span className="text-xs text-muted-foreground">· {timeAgo(tweet.referenceTime)}</span>
                        </div>
                        {tweet.contentOld && <p className="whitespace-pre-line dark:text-amber-50 my-2">{he.decode(tweet.contentOld)}</p>}
                        {getImageLayout(tweet.referencedFiles ? JSON.parse(tweet.referencedFiles) : [])}
                        <TweetVideo videoUrls={tweet.referencedVideos} />
                        {tweet.referencedTextTranslation && <p className="text-muted-foreground mt-2">{tweet.referencedTextTranslation}</p>}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
export default TweetCard