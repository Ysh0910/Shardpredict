// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Minimal ReentrancyGuard (no OZ dependency needed)
 */
abstract contract ReentrancyGuard {
    uint256 private _status = 1;
    modifier nonReentrant() {
        require(_status != 2, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }
}

contract PredictionMarket is ReentrancyGuard {

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct Market {
        string question;
        uint256 yesPool;
        uint256 noPool;
        bool resolved;
        bool outcome; // true = YES, false = NO
        bool exists;  // FIX: guard against invalid marketId
    }

    uint256 public marketCount;
    mapping(uint256 => Market) public markets;

    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool))    public claimed;

    // ── Events ────────────────────────────────────────────────────────────────
    event MarketCreated(uint256 indexed marketId, string question);
    event BetPlaced(uint256 indexed marketId, address indexed bettor, bool side, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event Claimed(uint256 indexed marketId, address indexed winner, uint256 reward);

    // ── Modifiers ─────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier marketExists(uint256 marketId) {
        require(markets[marketId].exists, "Market does not exist"); // FIX: validate marketId
        _;
    }

    // ── Owner functions ───────────────────────────────────────────────────────

    // FIX: restricted to owner so anyone can't spam markets
    function createMarket(string memory _question) public onlyOwner {
        uint256 id = marketCount;
        markets[id] = Market({
            question: _question,
            yesPool: 0,
            noPool: 0,
            resolved: false,
            outcome: false,
            exists: true
        });
        marketCount++;
        emit MarketCreated(id, _question);
    }

    // FIX: only owner resolves, existence checked
    function resolveMarket(uint256 marketId, bool _outcome)
        public
        onlyOwner
        marketExists(marketId)
    {
        require(!markets[marketId].resolved, "Already resolved");
        markets[marketId].resolved = true;
        markets[marketId].outcome  = _outcome;
        emit MarketResolved(marketId, _outcome);
    }

    // ── Betting ───────────────────────────────────────────────────────────────

    function betYes(uint256 marketId)
        public
        payable
        marketExists(marketId)   // FIX: existence guard
    {
        require(msg.value > 0,                       "Send ETH");
        require(!markets[marketId].resolved,         "Already resolved");

        yesBets[marketId][msg.sender] += msg.value;
        markets[marketId].yesPool     += msg.value;
        emit BetPlaced(marketId, msg.sender, true, msg.value);
    }

    function betNo(uint256 marketId)
        public
        payable
        marketExists(marketId)   // FIX: existence guard
    {
        require(msg.value > 0,                       "Send ETH");
        require(!markets[marketId].resolved,         "Already resolved");

        noBets[marketId][msg.sender] += msg.value;
        markets[marketId].noPool     += msg.value;
        emit BetPlaced(marketId, msg.sender, false, msg.value);
    }

    // ── Claim (CEI + nonReentrant) ────────────────────────────────────────────

    function claim(uint256 marketId)
        public
        nonReentrant             // FIX: reentrancy guard (belt)
        marketExists(marketId)
    {
        // CHECKS
        require(markets[marketId].resolved,          "Not resolved");
        require(!claimed[marketId][msg.sender],      "Already claimed");

        uint256 totalPool = markets[marketId].yesPool + markets[marketId].noPool;
        uint256 reward;

        if (markets[marketId].outcome) {
            uint256 userBet = yesBets[marketId][msg.sender];
            require(userBet > 0, "No winning bet");
            reward = (userBet * totalPool) / markets[marketId].yesPool;

            // EFFECTS — zero out before any external call   // FIX: strict CEI
            yesBets[marketId][msg.sender] = 0;
        } else {
            uint256 userBet = noBets[marketId][msg.sender];
            require(userBet > 0, "No winning bet");
            reward = (userBet * totalPool) / markets[marketId].noPool;

            // EFFECTS — zero out before any external call   // FIX: strict CEI
            noBets[marketId][msg.sender] = 0;
        }

        // EFFECTS — mark claimed before transfer            // FIX: moved above INTERACTION
        claimed[marketId][msg.sender] = true;

        // INTERACTION — external call goes last
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Transfer failed");

        emit Claimed(marketId, msg.sender, reward);
    }

    // ── View ──────────────────────────────────────────────────────────────────

    function getMarket(uint256 marketId)
        public
        view
        marketExists(marketId)
        returns (string memory, uint256, uint256, bool, bool)
    {
        Market memory m = markets[marketId];
        return (m.question, m.yesPool, m.noPool, m.resolved, m.outcome);
    }
}