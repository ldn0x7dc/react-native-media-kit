require 'json'
version = JSON.parse(File.read('../package.json'))["version"]

Pod::Spec.new do |s|

  s.name            = "react-native-media-kit"
  s.version         = version
  s.homepage        = "https://github.com/brentvatne/react-native-linear-gradient"
  s.summary         = "A <MediaPlayer /> component for react-native"
  s.license         = "MIT"
  s.author          = { "Gaurav Bansal" => "gaurav.mnit07@gmail.com" }
  s.platform        = :ios, "8.0"
  s.source          = { :git => "https://github.com/brentvatne/react-native-linear-gradient.git", :tag => "#{s.version}" }
  s.source_files    = 'react-native-media-kit/*.{h,m}'

  s.dependency 'React'

end
