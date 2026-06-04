#import <Cocoa/Cocoa.h>

@interface AppDelegate : NSObject <NSApplicationDelegate>
@property(nonatomic, strong) NSTask *serverTask;
@property(nonatomic, strong) NSFileHandle *logHandle;
@property(nonatomic, copy) NSString *port;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
  [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
  [self buildMenu];
  self.port = [[[NSProcessInfo processInfo] environment] objectForKey:@"RESEARCH_ASSIST_PORT"] ?: @"3214";

  if ([self serverIsReady]) {
    [self openApp];
    return;
  }

  NSURL *nodeURL = [self findNodeURL];
  if (!nodeURL) {
    [self showAlert:@"Insight Tadpole needs Node.js to run. The embedded runtime is missing, and no system Node.js binary was found."];
    return;
  }

  [self startServerWithNodeURL:nodeURL];
  [self waitForServer];
}

- (void)applicationWillTerminate:(NSNotification *)notification {
  if (self.serverTask && self.serverTask.isRunning) {
    [self.serverTask terminate];
  }
  [self.logHandle closeFile];
}

- (void)buildMenu {
  NSMenu *mainMenu = [[NSMenu alloc] init];
  NSMenuItem *appMenuItem = [[NSMenuItem alloc] init];
  NSMenu *appMenu = [[NSMenu alloc] initWithTitle:@"Insight Tadpole"];

  NSMenuItem *openItem = [[NSMenuItem alloc] initWithTitle:@"Open Insight Tadpole" action:@selector(openAppFromMenu:) keyEquivalent:@"o"];
  openItem.target = self;
  [appMenu addItem:openItem];
  [appMenu addItem:[NSMenuItem separatorItem]];
  [appMenu addItem:[[NSMenuItem alloc] initWithTitle:@"Quit Insight Tadpole" action:@selector(terminate:) keyEquivalent:@"q"]];

  appMenuItem.submenu = appMenu;
  [mainMenu addItem:appMenuItem];
  NSApp.mainMenu = mainMenu;
}

- (void)openAppFromMenu:(id)sender {
  [self openApp];
}

- (NSURL *)appDirURL {
  return [[[NSBundle mainBundle] resourceURL] URLByAppendingPathComponent:@"app"];
}

- (NSURL *)appURL {
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%@", self.port]];
}

- (NSURL *)metaURL {
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://127.0.0.1:%@/api/meta", self.port]];
}

- (void)openApp {
  [[NSWorkspace sharedWorkspace] openURL:[self appURL]];
}

- (NSURL *)findNodeURL {
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSURL *bundledNode = [[[NSBundle mainBundle] resourceURL] URLByAppendingPathComponent:@"runtime/node"];
  if ([fileManager isExecutableFileAtPath:bundledNode.path]) {
    return bundledNode;
  }

  for (NSString *path in @[@"/opt/homebrew/bin/node", @"/usr/local/bin/node", @"/usr/bin/node"]) {
    if ([fileManager isExecutableFileAtPath:path]) {
      return [NSURL fileURLWithPath:path];
    }
  }

  return nil;
}

- (void)startServerWithNodeURL:(NSURL *)nodeURL {
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSURL *logDir = [[fileManager homeDirectoryForCurrentUser] URLByAppendingPathComponent:@"Library/Logs/Insight Tadpole"];
  [fileManager createDirectoryAtURL:logDir withIntermediateDirectories:YES attributes:nil error:nil];
  NSURL *logFile = [logDir URLByAppendingPathComponent:@"server.log"];
  [fileManager createFileAtPath:logFile.path contents:nil attributes:nil];
  self.logHandle = [NSFileHandle fileHandleForWritingAtPath:logFile.path];
  [self.logHandle seekToEndOfFile];

  NSTask *task = [[NSTask alloc] init];
  task.executableURL = nodeURL;
  task.currentDirectoryURL = [self appDirURL];
  task.arguments = @[@"scripts/serve.mjs", @"--port", self.port];
  task.standardOutput = self.logHandle;
  task.standardError = self.logHandle;

  __weak typeof(self) weakSelf = self;
  task.terminationHandler = ^(NSTask *finishedTask) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (weakSelf.serverTask == finishedTask) {
        weakSelf.serverTask = nil;
      }
    });
  };

  NSError *error = nil;
  if ([task launchAndReturnError:&error]) {
    self.serverTask = task;
  } else {
    [self showAlert:[NSString stringWithFormat:@"Insight Tadpole could not start its local server: %@", error.localizedDescription]];
  }
}

- (void)waitForServer {
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    NSDate *deadline = [NSDate dateWithTimeIntervalSinceNow:12.0];
    while ([[NSDate date] compare:deadline] == NSOrderedAscending) {
      if ([self serverIsReady]) {
        dispatch_async(dispatch_get_main_queue(), ^{
          [self openApp];
        });
        return;
      }
      [NSThread sleepForTimeInterval:0.1];
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.serverTask && self.serverTask.isRunning) {
        [self.serverTask terminate];
      }
      [self showAlert:@"Insight Tadpole could not start its local server. See ~/Library/Logs/Insight Tadpole/server.log for details."];
    });
  });
}

- (BOOL)serverIsReady {
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[self metaURL]];
  request.timeoutInterval = 0.4;
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  __block BOOL ready = NO;

  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    if (data) {
      NSString *text = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
      if ([text containsString:@"\"storageMode\""]) {
        ready = YES;
      }
    }
    dispatch_semaphore_signal(semaphore);
  }];
  [task resume];

  dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.6 * NSEC_PER_SEC)));
  return ready;
}

- (void)showAlert:(NSString *)message {
  NSAlert *alert = [[NSAlert alloc] init];
  alert.messageText = @"Insight Tadpole";
  alert.informativeText = message;
  alert.alertStyle = NSAlertStyleWarning;
  [alert runModal];
}

@end

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    NSApplication *app = [NSApplication sharedApplication];
    AppDelegate *delegate = [[AppDelegate alloc] init];
    app.delegate = delegate;
    [app setActivationPolicy:NSApplicationActivationPolicyRegular];
    [app run];
  }
  return 0;
}
