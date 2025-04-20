#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <Expo/Expo.h>
#import <GoogleMaps/GoogleMaps.h>

@interface AppDelegate : EXAppDelegateWrapper
@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"AIzaSyCNPqyJ8qQrE8OjuvpyU66bPrNe1Ej9MRU"]; // Thêm API Key của bạn
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end
