import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  public type SensitivityProfile = {
    general : Nat;
    redDot : Nat;
    scope2x : Nat;
    scope4x : Nat;
    sniperScope : Nat;
    freeLook : Nat;
    deviceTier : Text;
  };

  public query ({ caller }) func getSensitivity(deviceName : Text) : async SensitivityProfile {
    if (deviceName.isEmpty()) {
      Runtime.trap("Device name cannot be empty");
    };

    let lowered = deviceName.toLower();
    if (lowered.contains(#text "iphone") or lowered.contains(#text "samsung s") or lowered.contains(#text "high-end")) {
      return {
        general = 100;
        redDot = 110;
        scope2x = 115;
        scope4x = 90;
        sniperScope = 85;
        freeLook = 100;
        deviceTier = "high-end";
      };
    };

    if (lowered.contains(#text "xiaomi") or lowered.contains(#text "redmi") or lowered.contains(#text "samsung a") or lowered.contains(#text "mid-range")) {
      return {
        general = 150;
        redDot = 155;
        scope2x = 148;
        scope4x = 135;
        sniperScope = 120;
        freeLook = 125;
        deviceTier = "mid-range";
      };
    };

    if (lowered.contains(#text "moto") or lowered.contains(#text "budget") or lowered.contains(#text "low-end") or lowered.contains(#text "itel") or lowered.contains(#text "tecno") or lowered.contains(#text "infinix")) {
      return {
        general = 185;
        redDot = 180;
        scope2x = 185;
        scope4x = 170;
        sniperScope = 155;
        freeLook = 170;
        deviceTier = "low-end";
      };
    };

    {
      general = 150;
      redDot = 155;
      scope2x = 148;
      scope4x = 135;
      sniperScope = 120;
      freeLook = 125;
      deviceTier = "mid-range (default)";
    };
  };
};
