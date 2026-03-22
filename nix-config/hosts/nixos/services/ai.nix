{ pkgs-unstable, ... }:
{
  services.ollama = {
    enable = true;
    acceleration = "cuda";
    package = pkgs-unstable.ollama;

    openFirewall = true;

    host = "0.0.0.0";
  };

  services.wyoming = {
    ### Voice Recognition ###
    faster-whisper.servers = {
      home = {
        enable = true;
        uri = "tcp://0.0.0.0:10300";
        language = "en";
        device = "cuda";
        model = "distil-large-v3";
      };
    };

    ### Text-to-speech ##
    piper = {
      servers.home = {
        enable = true;
        voice = "en_GB-southern_english_female-low";
        uri = "tcp://0.0.0.0:10200";
      };
    };
  };
}
