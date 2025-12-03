import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import logo from '@/assets/logo.svg';
import { Button } from "@/components/ui/button";
import { Check, Copy, DollarSign, IndianRupee, LogOut, Monitor, Moon, ScanFace, SquareArrowOutUpRight, SunMedium } from 'lucide-react';
import { useTheme } from "@/contexts/ThemeContext";
import { useAppContext, type Token } from "@/contexts/AppContext";
import { useEffect, useState } from 'react';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group"
import { cn } from "@/lib/utils";

interface TokenApi {
    name: string;
    token_address: string;
    decimals: number;
    symbol: string;
    balance_formatted: number;
    usd_price: number;
    usd_price_24hr_usd_change: number;
    possible_spam: boolean;
    logo: string;
}

const Navbar = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { theme, setTheme } = useTheme();
    const { address, setAddress, setWalletBalance, setTokens, setBnbToken, bnbToken } = useAppContext();
    const { currency, setCurrency, rateUpdateTrigger } = useCurrencyContext();
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [cookie, setCookie] = useState<string>('');
    const [copying, setCopying] = useState<boolean>(false);

    const connectWallet = async () => {
        if (typeof window.ethereum !== "undefined") {
        try {
            const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
            });

            setAddress(accounts[0]);
            localStorage.setItem("address", accounts[0]);

            const chainId = await window.ethereum.request({ method: "eth_chainId" });
            if (chainId !== "0x38") {
            alert("Please switch to Binance Smart Chain.");
            }

        } catch (err) {
            console.error("Wallet connection failed:", err);
        }
        } else {
        alert("MetaMask not found. Please install it.");
        }
    };

    const disconnectWallet = () => {
        setAddress(null);
        localStorage.removeItem("address");
        setWalletBalance(0);
    };

    async function getAllTokens(walletAddress: string, chain: string) {
        const url = `${import.meta.env.VITE_BOT_BASE_URL}/api/wallet-tokens/${walletAddress}/${chain}`;
      
        const res = await fetch(url);
        
        const data = await res.json();
        const tokens = data.data;
      
        if (!tokens) return [];

        const bnbFormatted = tokens.filter((token: TokenApi) => (token.token_address === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" || token.symbol === "BNB")).map((token: TokenApi) => ({
            contract_name: token.name,
            contract_address: token.token_address,
            contract_ticker_symbol: token.symbol,
            decimals: token.decimals,
            balance: Number(token.balance_formatted),
            quote: Number(token.balance_formatted) * token.usd_price,
            quote_rate: token.usd_price,
            quote_rate_24h: token.usd_price + token.usd_price_24hr_usd_change,
            is_spam: token.possible_spam,
            logo_url: token.logo ?? "",
        }));

        if (!bnbToken) {
          setBnbToken(bnbFormatted[0])
        }

        const blocked = [
          "0x64c6cdf0459ebd192c2f2db68e2df4f32e45ae94",
          "0x955ac77fedee5f3aaa8b17b8ceb5dd64e94b63ba",
          "0x77221cc5373cde45a58b1a11a9e6d63b0f2d0e4d",
          "0x22d150642734734fa2e4d9b251af95ea38c89f0c",
          "0xb4abed79d90de6e800b9ee0adae166c8eb7e9a76",
          "0x5f058e67f1bc6292ecc25c923c1be1d2a54486a5",
          "0x5707c78c86eb3e1c121fd79e6b38a5c2ca835e72",
          "0x3ed18f61be1d19b49f97739a127dceafdeeccbe5"
        ];

        const formatted = tokens.result.filter((token: TokenApi) => !blocked.includes(token.token_address)).map((token: TokenApi) => ({
            contract_name: token.name,
            contract_address: token.token_address,
            contract_ticker_symbol: token.symbol,
            decimals: token.decimals,
            balance: Number(token.balance_formatted),
            quote: Number(token.balance_formatted) * token.usd_price,
            quote_rate: token.usd_price,
            quote_rate_24h: token.usd_price + token.usd_price_24hr_usd_change,
            is_spam: token.possible_spam,
            logo_url: token.logo ?? "",
        }));

        const netBalance = formatted.reduce((acc: number, token: Token) => acc + token.quote, 0);

        setWalletBalance(netBalance);

        const updated = await Promise.all(
            formatted
              .filter((token: Token) => token.contract_ticker_symbol !== "ELON" && token.quote > 0)
              .map(async (token: Token) => {
                if (!token.logo_url) {
                  try {
                    const res = await fetch(
                      `${import.meta.env.VITE_BOT_BASE_URL}/api/token/${token.contract_address}/details`,
                      {
                        headers: { accept: "application/json" },
                      }
                    );
        
                    const logo = await res.json();
                    token.logo_url = logo?.data?.icon ?? "";
                  } catch (e) {
                    console.error("Error fetching logo for", token.contract_address, e);
                  }
                }
                return token;
              })
        );
    
        setTokens(updated)
    }

    async function copyAddress() {
      if (!address) return;

      setCopying(true);

      await navigator.clipboard.writeText(address);
    }

    useEffect(() => {
      if (!copying) return;

      const timeout = setTimeout(() => {
        setCopying(false);
      }, 1500);

      return () => clearTimeout(timeout);
    }, [copying]);

    useEffect(() => {
        getAllTokens(address!, "bsc");

        const interval = setInterval(() => {
            getAllTokens(address!, "bsc");
        }, 120_000); // 120 seconds

        return () => clearInterval(interval);

    }, [address, setWalletBalance, setAddress, rateUpdateTrigger]);

    const updateBinanceAuth = async (csrfToken: string, cookie: string) => {
      try {
        const response = await axios.post(
            `${import.meta.env.VITE_BOT_BASE_URL}/api/binance/auth`,
            {
                csrfToken,
                cookie,
            }
        );
        console.log(response.data);
      } catch (error) {
          console.error(error);
      }
    }

    return (
        <nav className="w-full h-16 bg-background relative flex items-center justify-between">
            <img onClick={() => navigate("/")} className='dark:invert cursor-pointer' src={logo} />
            <ButtonGroup className="absolute left-1/2 -translate-x-1/2">
              <Button onClick={() => navigate("/")} variant="outline" className={cn("min-w-25", location.pathname === "/" && "text-primary hover:text-primary")}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </Button>
              <ButtonGroupSeparator />
              <Button onClick={() => navigate("/defi")} variant="outline" className={cn("min-w-25", location.pathname === "/defi" && "text-primary hover:text-primary")}>DeFi</Button>
              <ButtonGroupSeparator />
              <Button onClick={() => navigate("/opinion")} variant="outline" className={cn("min-w-25", location.pathname === "/opinion" && "text-primary hover:text-primary")}>Opinion</Button>
              <ButtonGroupSeparator />
              <Button onClick={() => navigate("/perps")} variant="outline" className={cn("min-w-25", location.pathname === "/perps" && "text-primary hover:text-primary")}>Perps</Button>
            </ButtonGroup>
            <div className="flex items-center w-full gap-x-4 justify-end">
                {location.pathname.includes("defi") && <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <ScanFace />
                       Auth</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Update Binance Authentication</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please update your Binance authentication to continue.
                      </AlertDialogDescription>
                      <div className="flex flex-col gap-y-4 my-6">
                        <div className="flex flex-col gap-y-2">
                          <label htmlFor="csrfToken">CSRF Token</label>
                          <Input placeholder="CSRF Token" value={csrfToken} onChange={(e) => setCsrfToken(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-y-2">
                          <label htmlFor="cookie">Cookie</label>
                          <Input placeholder="p20t=web..." value={cookie} onChange={(e) => setCookie(e.target.value)} />
                        </div>
                      </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => updateBinanceAuth(csrfToken, cookie)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>}

                {address 
                ? 
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar>
                      <AvatarImage src="https://wallpapers.com/images/featured-full/cool-profile-picture-87h46gcobjl5e4xu.jpg" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem className="h-8 -mt-1 hover:bg-transparent hover:text-inherit focus:bg-transparent focus:text-inherit">
                          <img src="/MetaMask-light.svg" className="h-4.5" alt="MetaMask" />
                          {address.slice(0, 6)}...{address.slice(-4)}
                          <button disabled={copying} onClick={(e) => {e.preventDefault(); copyAddress()}} className="p-1.5 hover:bg-background rounded-md ms-auto">
                            {copying ? <Check /> : <Copy />}
                          </button>
                          <button onClick={(e) => {e.preventDefault(); disconnectWallet()}} className="p-1.5  hover:bg-background rounded-md -ms-1.5 -me-2">
                            <LogOut className="text-red-400" />
                          </button>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        UI
                      </DropdownMenuLabel>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span className="flex items-center gap-2">
                            {theme === "light" && (
                              <>
                                <SunMedium className="h-4 w-4" />
                                <span>Light</span>
                              </>
                            )}
                            {theme === "dark" && (
                              <>
                                <Moon className="h-4 w-4" />
                                <span>Dark</span>
                              </>
                            )}
                            {theme === "system" && (
                              <>
                                <Monitor className="h-4 w-4" />
                                <span>System</span>
                              </>
                            )}
                          </span>
                        </DropdownMenuSubTrigger>

                        <DropdownMenuPortal>
                          <DropdownMenuSubContent sideOffset={6}>
                            <DropdownMenuItem
                              onClick={() => setTheme("light")}
                              className="flex items-center gap-2"
                            >
                              <SunMedium className="h-4 w-4" />
                              Light
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setTheme("dark")}
                              className="flex items-center gap-2"
                            >
                              <Moon className="h-4 w-4" />
                              Dark
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setTheme("system")}
                              className="flex items-center gap-2"
                            >
                              <Monitor className="h-4 w-4" />
                              System
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span className="flex items-center gap-2">
                            {currency === "inr" ? (
                              <>
                                <IndianRupee className="h-4 w-4" />
                                <span>INR</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-4 w-4" />
                                <span>USD</span>
                              </>
                            )}
                          </span>
                        </DropdownMenuSubTrigger>

                        <DropdownMenuPortal>
                          <DropdownMenuSubContent sideOffset={6}>
                            <DropdownMenuItem
                              onClick={() => setCurrency("inr")}
                              className="flex items-center gap-2"
                            >
                              <IndianRupee className="h-4 w-4" />
                              <span>INR</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setCurrency("usd")}
                              className="flex items-center gap-2"
                            >
                              <DollarSign className="h-4 w-4" />
                              <span>USD</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled>More Soon...</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        APIs
                      </DropdownMenuLabel>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span className="flex items-center gap-2">
                            GITHUB
                          </span>
                        </DropdownMenuSubTrigger>

                        <DropdownMenuPortal>
                          <DropdownMenuSubContent sideOffset={6}>
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                            >
                              Frontend
                              <a className="ms-auto" href="https://github.com/abhas-kumar-sinha/trading-bot-frontend" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                              </a>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="flex items-center gap-2"
                            >
                              Backend-DeFi
                              <a className="ms-auto" href="https://github.com/abhas-kumar-sinha/trading-bot-backend-defi" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                              </a>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="flex items-center gap-2"
                            >
                              Backend-opinion
                              <a className="ms-auto" href="https://github.com/abhas-kumar-sinha/trading-bot-backend-opinion" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span className="flex items-center gap-2">
                            Aggregator
                          </span>
                        </DropdownMenuSubTrigger>

                        <DropdownMenuPortal>
                          <DropdownMenuSubContent sideOffset={6}>
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                            >
                              1inch (SMW)
                              <a className="ms-auto" href="https://business.1inch.com/portal/dashboard" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                              </a>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="flex items-center gap-2"
                            >
                              LiFi (ATC)
                              <a className="ms-auto" href="https://portal.li.fi/integrations" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                              </a>
                            </DropdownMenuItem>

                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuItem>
                        VM
                        <a className="ms-auto" href="https://portal.azure.com/#@iitd.ac.in/resource/subscriptions/cfe26d18-e5c3-493a-ad1d-1bc34b937efc/resourceGroups/my-vm-group/providers/Microsoft.Compute/virtualMachines/bsc-trading-bot/connect" target="_blank" rel="noopener noreferrer">
                        <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        RPC
                        <a className="ms-auto" href="https://dashboard.quicknode.com/endpoints/568131" target="_blank" rel="noopener noreferrer">
                        <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Defi Exchange
                        <a className="ms-auto" href="https://web3.binance.com/en-IN/markets/trending?chain=bsc" target="_blank" rel="noopener noreferrer">
                        <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Database
                        <a className="ms-auto" href="https://console.neon.tech/app/projects/ancient-tooth-08902969/branches/br-cool-lake-a1a4dgyt/tables" target="_blank" rel="noopener noreferrer">
                        <DropdownMenuShortcut><SquareArrowOutUpRight /></DropdownMenuShortcut>
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                :
                <Button onClick={connectWallet} className='rounded-lg pt-1.5'>Connect Wallet</Button>
                }
          </div>
        </nav>
    )
}
export default Navbar