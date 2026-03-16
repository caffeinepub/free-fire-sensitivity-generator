import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Iter "mo:core/Iter";



actor {
  type DeviceTier = {
    general : Nat;
    redDot : Nat;
    scope2x : Nat;
    scope4x : Nat;
    sniperScope : Nat;
    freeLook : Nat;
    tierName : Text;
  };

  type SensitivityProfile = {
    general : Nat;
    redDot : Nat;
    scope2x : Nat;
    scope4x : Nat;
    sniperScope : Nat;
    freeLook : Nat;
    deviceTier : Text;
  };

  public type UserProfile = {
    name : Text;
    deviceName : Text;
  };

  type UserState = {
    lastGenerationTime : Int;
    paidUntil : Int;
  };

  public type PaidUserInfo = {
    user : Principal;
    name : Text;
    deviceName : Text;
    paidUntil : Int;
    isPaid : Bool;
  };

  public type Transaction = {
    principal : Principal;
    txId : Text;
    timestamp : Int;
  };

  // Constants for max values
  let maxSensitivityValue = 185 : Nat;
  let sensitivityDefaults : SensitivityProfile = {
    general = 150;
    redDot = 155;
    scope2x = 148;
    scope4x = 135;
    sniperScope = 120;
    freeLook = 125;
    deviceTier = "mid-range (default)";
  };

  // Initialize access control state.
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let deviceTiers = Map.fromIter<Text, DeviceTier>(
    [
      (
        "high-end",
        {
          general = 100;
          redDot = 110;
          scope2x = 115;
          scope4x = 90;
          sniperScope = 85;
          freeLook = 100;
          tierName = "high-end";
        },
      ),
      (
        "mid-range",
        {
          general = 150;
          redDot = 155;
          scope2x = 148;
          scope4x = 135;
          sniperScope = 120;
          freeLook = 125;
          tierName = "mid-range";
        },
      ),
      (
        "low-end",
        {
          general = 185;
          redDot = 180;
          scope2x = 185;
          scope4x = 170;
          sniperScope = 155;
          freeLook = 170;
          tierName = "low-end";
        },
      ),
    ].values(),
  );

  let exclusionMappings = Map.fromIter(
    [
      (
        "high-end",
        [
          "ipad", "new-iphone", "intel-processor", "gaming-phone"
        ],
      ),
      (
        "mid-range",
        [
          "xiaomi", "redmi", "samsung a", "moto"
        ],
      ),
      (
        "low-end",
        [
          "itel", "tecno", "infinix", "low-budget", "older-devices"
        ],
      ),
    ].values(),
  );

  let generationRecords = Map.empty<Principal, UserState>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let pendingTransactionIds = Map.empty<Principal, Text>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Sensitivity generation - requires user authentication
  public query ({ caller }) func getSensitivity(deviceName : Text) : async SensitivityProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate sensitivity profiles");
    };

    if (deviceName == "") {
      Runtime.trap("Device name cannot be empty");
    };

    let lowered = deviceName.toLower();
    switch (getDeviceTier(lowered)) {
      case (?tier) {
        {
          general = tier.general;
          redDot = tier.redDot;
          scope2x = tier.scope2x;
          scope4x = tier.scope4x;
          sniperScope = tier.sniperScope;
          freeLook = tier.freeLook;
          deviceTier = tier.tierName;
        };
      };
      case (null) { sensitivityDefaults };
    };
  };

  public shared ({ caller }) func submitTransactionId(txId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit transactions");
    };

    if (pendingTransactionIds.containsKey(caller)) {
      Runtime.trap("You already have a pending transaction");
    };
    pendingTransactionIds.add(caller, txId);
  };

  // Daily generation tracking - only for registered users
  public query ({ caller }) func canGenerateToday() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check generation status");
    };

    switch (generationRecords.get(caller)) {
      case (?state) {
        // Check if user is paid
        if (state.paidUntil > Time.now()) { return true };

        // Free users get one generation per day
        Time.now() - state.lastGenerationTime >= 24 * 3600 * 1000000000;
      };
      case (null) { true };
    };
  };

  public query ({ caller }) func getRemainingGenerationsToday() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check remaining generations");
    };

    switch (generationRecords.get(caller)) {
      case (?state) {
        // Paid users have unlimited generations
        if (state.paidUntil > Time.now()) { return 1 };

        // Free user: check if already generated today
        if (Time.now() - state.lastGenerationTime >= 24 * 3600 * 1000000000) {
          1;
        } else { 0 };
      };
      case (null) { 1 };
    };
  };

  public shared ({ caller }) func recordGeneration() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate");
    };

    let now = Time.now();
    switch (generationRecords.get(caller)) {
      case (?state) {
        // Paid users have no restrictions
        if (state.paidUntil > now) {
          generationRecords.add(caller, { state with lastGenerationTime = now });
          return;
        };

        // Free user: check daily limit
        if (now - state.lastGenerationTime < 24 * 3600 * 1000000000) {
          Runtime.trap("Generation limit reached for today");
        };
        generationRecords.add(caller, {
          state with
          lastGenerationTime = now;
        });
      };
      case (null) {
        // First time for user
        generationRecords.add(caller, {
          lastGenerationTime = now;
          paidUntil = 0;
        });
      };
    };
  };

  // Paid functionality
  public query ({ caller }) func isCallerPaid() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check payment status");
    };

    switch (generationRecords.get(caller)) {
      case (?state) { state.paidUntil > Time.now() };
      case (null) { false };
    };
  };

  // Admin-only function to mark user as paid
  public shared ({ caller }) func markUserAsPaid(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can mark users as paid");
    };

    let expiresIn = 30 * 24 * 3600 * 1000000000;

    switch (generationRecords.get(user)) {
      case (?state) {
        generationRecords.add(user, { state with paidUntil = Time.now() + expiresIn });
      };
      case (null) {
        generationRecords.add(user, {
          lastGenerationTime = 0;
          paidUntil = Time.now() + expiresIn;
        });
      };
    };
  };

  // Admin-only function to get paid users
  public query ({ caller }) func getPaidUsers() : async [PaidUserInfo] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view paid users");
    };

    generationRecords.toArray().map(func((user, state)) {
      let profile = userProfiles.get(user);
      ?{
        user;
        name = switch (profile) { case (?p) { p.name }; case (null) { "" } };
        deviceName = switch (profile) { case (?p) { p.deviceName }; case (null) { "" } };
        paidUntil = state.paidUntil;
        isPaid = state.paidUntil > Time.now();
      };
    }).filterMap(func(x) { x });
  };

  // Admin-only function to approve transaction
  public shared ({ caller }) func approveTransaction(txId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can approve transactions");
    };

    // Find principal for the transaction id
    let matchingEntry = pendingTransactionIds.entries().find(
      func((p, tId)) { tId == txId }
    );

    switch (matchingEntry) {
      case (?entry) {
        // Remove from pending
        ignore pendingTransactionIds.remove(entry.0);
        // Mark as paid - internal call
        grantPremiumAccess(entry.0);
      };
      case (null) {
        Runtime.trap("Transaction not found");
      };
    };
  };

  // Admin-only function to get pending transactions
  public query ({ caller }) func getPendingTransactions() : async [Transaction] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view pending transactions");
    };

    pendingTransactionIds.toArray().map(
      func((p, txId)) {
        {
          principal = p;
          txId;
          timestamp = Time.now();
        };
      }
    );
  };

  // Internal helper function to grant premium access
  private func grantPremiumAccess(user : Principal) {
    let expiresIn = 30 * 24 * 3600 * 1000000000;

    switch (generationRecords.get(user)) {
      case (?state) {
        generationRecords.add(user, { state with paidUntil = Time.now() + expiresIn });
      };
      case (null) {
        generationRecords.add(user, {
          lastGenerationTime = 0;
          paidUntil = Time.now() + expiresIn;
        });
      };
    };
  };

  // Helper functions
  func getDeviceTier(deviceDescriptor : Text) : ?DeviceTier {
    switch (deviceTiers.get(deviceDescriptor)) {
      case (?tier) { ?tier };
      case (null) {
        switch (findFromExclusions(deviceDescriptor)) {
          case (?tierName) { deviceTiers.get(tierName) };
          case (null) { null };
        };
      };
    };
  };

  func findFromExclusions(deviceDescriptor : Text) : ?Text {
    for ((tier, keywords) in exclusionMappings.entries()) {
      for (keyword in keywords.values()) {
        if (deviceDescriptor.contains(#text keyword)) { return ?tier };
      };
    };
    null;
  };
};
