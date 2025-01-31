require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']
  s.description  = "Cat"

  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.platform     = :ios, "12.0"

  #s.source       = { :git => '/' }
  s.source       = { :git => "https://github.com/Catapush/catapush-react-native-sdk", :tag => "v#{s.version}" }
  s.source_files  = "ios/**/*.{h,m,swift}"

  s.frameworks = 'SystemConfiguration','MobileCoreServices'
  s.dependency 'React'
  s.dependency 'catapush-ios-sdk-pod', '2.2.4'
  s.static_framework = true
end
